class CassandraAdapter {
  constructor(keyspace = 'storylab_voice_telemetry') {
    this.keyspace = keyspace;
    this.columnFamilies = {
      voice_telemetry_by_student: new Map()
    };
    console.log(`[Apache Cassandra Adapter] Initialized for Keyspace: ${this.keyspace}`);
  }

  getCqlSchema() {
    return `
CREATE KEYSPACE IF NOT EXISTS ${this.keyspace}
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3};

CREATE TABLE IF NOT EXISTS ${this.keyspace}.voice_telemetry_by_student (
    student_prn text,
    session_date date,
    event_timestamp timestamp,
    utterance_text text,
    confidence_score float,
    intent_matched text,
    latency_ms int,
    PRIMARY KEY ((student_prn, session_date), event_timestamp)
) WITH CLUSTERING ORDER BY (event_timestamp DESC);
    `.trim();
  }

  async executeInsert(telemetry) {
    const partitionKey = `${telemetry.student_prn}_${telemetry.session_date}`;
    if (!this.columnFamilies.voice_telemetry_by_student.has(partitionKey)) {
      this.columnFamilies.voice_telemetry_by_student.set(partitionKey, []);
    }
    const cluster = this.columnFamilies.voice_telemetry_by_student.get(partitionKey);
    cluster.push({
      ...telemetry,
      event_timestamp: telemetry.event_timestamp || new Date().toISOString()
    });

    return {
      cql: `INSERT INTO ${this.keyspace}.voice_telemetry_by_student JSON '${JSON.stringify(telemetry)}';`,
      applied: true
    };
  }

  async queryPartition(studentPrn, sessionDate) {
    const partitionKey = `${studentPrn}_${sessionDate}`;
    const rows = this.columnFamilies.voice_telemetry_by_student.get(partitionKey) || [];
    return {
      cql: `SELECT * FROM ${this.keyspace}.voice_telemetry_by_student WHERE student_prn = '${studentPrn}' AND session_date = '${sessionDate}';`,
      rowLength: rows.length,
      rows
    };
  }
}

module.exports = new CassandraAdapter();

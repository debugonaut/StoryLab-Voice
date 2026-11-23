class DynamoDBAdapter {
  constructor(tableName = 'StoryLabVoice_Sessions') {
    this.tableName = tableName;
    this.inMemoryDynamoStore = new Map();
    console.log(`[DynamoDB Adapter] Initialized for Table: ${this.tableName}`);
  }

  async putItem(item) {
    const key = `${item.PK}#${item.SK}`;
    const payload = {
      ...item,
      _version: 1,
      updatedAt: new Date().toISOString()
    };
    this.inMemoryDynamoStore.set(key, payload);
    return {
      ConsumedCapacity: { TableName: this.tableName, CapacityUnits: 1.0 },
      Item: payload
    };
  }

  async getItem(pk, sk) {
    const key = `${pk}#${sk}`;
    const item = this.inMemoryDynamoStore.get(key);
    return {
      ConsumedCapacity: { TableName: this.tableName, CapacityUnits: 0.5 },
      Item: item || null
    };
  }

  async queryByPK(pk) {
    const items = [];
    for (const [key, value] of this.inMemoryDynamoStore.entries()) {
      if (key.startsWith(`${pk}#`)) {
        items.push(value);
      }
    }
    return {
      Count: items.length,
      Items: items
    };
  }

  async deleteItem(pk, sk) {
    const key = `${pk}#${sk}`;
    const existed = this.inMemoryDynamoStore.delete(key);
    return {
      ConsumedCapacity: { TableName: this.tableName, CapacityUnits: 1.0 },
      Success: existed
    };
  }
}

module.exports = new DynamoDBAdapter();

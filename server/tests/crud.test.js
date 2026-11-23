const http = require('http');
const app = require('../app');

const TEST_PORT = 5055;
let server;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   PRACTICAL NO. 06: RESTful API CRUD TEST SUITE      ');
  console.log('======================================================\n');

  server = app.listen(TEST_PORT);
  let passed = 0;
  let total = 0;

  const assertTest = (name, condition, details = '') => {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] Test ${total}: ${name}`);
    } else {
      console.error(`  [FAIL] Test ${total}: ${name} - Details: ${details}`);
    }
  };

  try {
    const resRoot = await makeRequest('GET', '/api');
    assertTest('GET /api (API Health & Explorer)', resRoot.status === 200 && resRoot.data.status === 'OPERATIONAL');

    const newStudent = {
      prn: '202401109999',
      name: 'Radhika Sharma',
      email: 'radhika.sharma@example.edu',
      age: 14,
      grade: 'Grade 9',
      preferredLanguage: 'en-IN'
    };
    const resCreate = await makeRequest('POST', '/api/students', newStudent);
    assertTest('POST /api/students (Create Student - CRUD [C])', resCreate.status === 201 && resCreate.data.success);

    const resList = await makeRequest('GET', '/api/students');
    assertTest('GET /api/students (Read All Students - CRUD [R])', resList.status === 200 && Array.isArray(resList.data.data));

    const resGetOne = await makeRequest('GET', '/api/students/202401109999');
    assertTest('GET /api/students/:prn (Read Single Student - CRUD [R])', resGetOne.status === 200 && resGetOne.data.data.name === 'Radhika Sharma');

    const updatePayload = {
      prn: '202401109999',
      name: 'Radhika S. Sharma',
      email: 'radhika.sharma@example.edu',
      age: 15,
      grade: 'Grade 10',
      preferredLanguage: 'hi-IN'
    };
    const resUpdate = await makeRequest('PUT', '/api/students/202401109999', updatePayload);
    assertTest('PUT /api/students/:prn (Update Student - CRUD [U])', resUpdate.status === 200 && resUpdate.data.data.age === 15);

    const resDelete = await makeRequest('DELETE', '/api/students/202401109999');
    assertTest('DELETE /api/students/:prn (Delete Student - CRUD [D])', resDelete.status === 200 && resDelete.data.success);

    const invalidPayload = { prn: '123', name: 'X', age: 99 };
    const resInvalid = await makeRequest('POST', '/api/students', invalidPayload);
    assertTest('POST /api/students (Server-Side Validation Failure Guard)', resInvalid.status === 400 && resInvalid.data.errorType === 'EXPRESS_VALIDATION_ERROR');

    const resNode = await makeRequest('GET', '/api/node/runtime-info');
    assertTest('GET /api/node/runtime-info (Node.js OS & Runtime Inspection)', resNode.status === 200 && resNode.data.data.framework === 'Node.js Core Runtime');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    console.log('\n------------------------------------------------------');
    console.log(`   SUMMARY: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log('------------------------------------------------------\n');
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };

const fs = require('fs');
const path = require('path');

const folder = path.join(__dirname, '../postman/collections/Lab05 API Testing');

const tests = [
  ['Register - Happy Path', 'B231234567', 'CS201', 201, 'OK'],
  ['Register - Inactive Student', 'B231234568', 'CS201', 200, 'ERROR_INACTIVE_STUDENT'],
  ['Register - Missing Field', 'B231234567', null, 400, 'ERROR_BAD_REQUEST'],
  ['Register - No Course', 'B231234567', 'CS999', 200, 'ERROR_NO_COURSE'],
  ['Register - No Prerequisites', 'B231234570', 'CS201', 201, 'OK'],
  ['Register - No Student', 'B999999999', 'CS201', 200, 'ERROR_NO_STUDENT'],
  ['Register - Prerequisites Met', 'B231234567', 'CS301', 201, 'OK'],
  ['Register - Prerequisites Not Met', 'B231234569', 'CS301', 200, 'ERROR_PREREQUISITES'],
  ['Register - Double Error No Student and No Course', 'B999999999', 'CS999', 200, 'ERROR_NO_STUDENT'],
  ['Register - Double Error Inactive and No Course', 'B231234568', 'CS999', 200, 'ERROR_INACTIVE_STUDENT']
];

function req(name, method, url, body) {
  const item = {
    name,
    request: {
      method,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      url: '{{baseUrl}}' + url
    }
  };

  if (body) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } }
    };
  }

  return item;
}

const items = tests.map(([name, student, course, status, result], index) => {
  const requests = [];

  if (course === 'CS201' || course === 'CS301') {
    requests.push(req(
      'Setup Course ' + course,
      'PUT',
      '/courses/' + course,
      { prerequisites: course === 'CS301' ? ['CS201'] : [] }
    ));
  }

  if (student !== 'B999999999') {
    let statusValue = student === 'B231234568' ? 'inactive' : 'active';
    let coursesTaken = student === 'B231234567' && course === 'CS301' ? ['CS201'] : [];

    requests.push(req(
      'Setup Student ' + student,
      'PUT',
      '/students/' + student,
      { status: statusValue, coursesTaken }
    ));
  }

  const body = { studentID: student };
  if (course !== null) body.courseID = course;

  const registration = req(name, 'POST', '/registrations', body);

  const assertions = [
    `pm.test("HTTP status ${status}", function () { pm.response.to.have.status(${status}); });`,
    `pm.test("Result ${result}", function () { pm.expect(pm.response.json().result).to.eql("${result}"); });`
  ];

  if (result === 'ERROR_PREREQUISITES') {
    assertions.push(
      'pm.test("Missing prerequisite CS201", function () { pm.expect(pm.response.json().missing).to.include("CS201"); });'
    );
  }

  registration.event = [{
    listen: 'test',
    script: { type: 'text/javascript', exec: assertions }
  }];

  requests.push(registration);

  return { name: `Test ${index + 1} - ${name}`, item: requests };
});

const collection = {
  info: {
    name: 'Lab05 API Testing',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: items,
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000', type: 'string' }]
};

fs.writeFileSync(
  path.join(__dirname, '../lab05-collection.json'),
  JSON.stringify(collection, null, 2)
);

console.log('lab05-collection.json амжилттай үүслээ.');
console.log('Нийт тест:', tests.length);
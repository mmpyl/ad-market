const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  if (res.statusCode === 200) {
    console.log('Validation successful!');
  } else {
    console.error('Validation failed!');
    process.exit(1);
  }
});

req.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

req.end();
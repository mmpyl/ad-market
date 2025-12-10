const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const dir = './src';

fs.readdir(dir, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach(file => {
    if (path.extname(file) === '.ts' || path.extname(file) === '.tsx') {
      exec(`grep -r "import" ${path.join(dir, file)}`, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(stdout);
      });
    }
  });
});
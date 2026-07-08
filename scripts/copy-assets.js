const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const govukDist = path.join(root, 'node_modules', 'govuk-frontend', 'dist', 'govuk');
const publicDir = path.join(root, 'src', 'app', 'public');

fs.mkdirSync(path.join(publicDir, 'javascripts'), { recursive: true });
fs.mkdirSync(path.join(publicDir, 'assets'), { recursive: true });

fs.copyFileSync(
  path.join(govukDist, 'govuk-frontend.min.js'),
  path.join(publicDir, 'javascripts', 'govuk-frontend.min.js'),
);

fs.cpSync(path.join(govukDist, 'assets'), path.join(publicDir, 'assets'), {
  recursive: true,
});

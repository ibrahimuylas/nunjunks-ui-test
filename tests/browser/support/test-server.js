const { createApp } = require('../../../src/app/app');

const host = '::1';
const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, host, () => {
  console.log(`Browser test server listening on http://[${host}]:${port}`);
});

server.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

let isShuttingDown = false;

function shutDown() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

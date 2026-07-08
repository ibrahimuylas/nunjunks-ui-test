const { createApp } = require('./app');
const net = require('net');

const preferredPort = Number(process.env.PORT || 3434);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

async function startServer() {
  const port = await findAvailablePort(preferredPort);
  const app = createApp();

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is in use, using ${port} instead.`);
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});

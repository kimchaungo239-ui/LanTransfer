import net from 'node:net';
import os from 'node:os';

export function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
}

export function getPreferredLanAddress() {
  return getLanAddresses()[0] || '127.0.0.1';
}

export async function findAvailablePort(startPort = 43210) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (await canListen(port)) {
      return port;
    }
  }
  throw new Error(`No available port found from ${startPort} to ${startPort + 49}.`);
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

import http from 'http';

import { app } from './app';
import { insertSeeds } from './seeds';
import { sequelize } from './sequelize';
import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

async function main() {
  // see: https://nodejs.org/dist/latest-v4.x/docs/api/cluster.html
  if (cluster.isMaster) {
    // データベースの初期化を
    await sequelize.sync({
      force: true,
      logging: false,
    });
    await insertSeeds();

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    const server = http.createServer(app);

    server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => {
      const address = server.address();
      console.log(`Listening on ${address.address}:${address.port}`);
    });
  }
}

main().catch(console.error);

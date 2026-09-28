import { createServer } from 'vite';

const PORTS = [3000, 2021, 2027, 2028];
const servers = [];

async function startServers() {
  console.log('🚀 Memulai SiTransparan Vite Multi-Port Server...');

  for (const port of PORTS) {
    try {
      const server = await createServer({
        server: {
          port,
          strictPort: true,
          host: '0.0.0.0',
        },
        configFile: './vite.config.js',
      });

      await server.listen();
      servers.push(server);
      console.log(`  ✓ Port ${port} aktif: http://localhost:${port}/`);
    } catch (err) {
      console.error(`  ✗ Gagal memulai port ${port}:`, err.message);
    }
  }

  console.log('\n✨ Semua server berjalan serentak:');
  console.log('   - http://localhost:3000/#data');
  console.log('   - http://localhost:2021/#data');
  console.log('   - http://localhost:2027/#data');
  console.log('   - http://localhost:2028/#data\n');
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nMenutup semua server...');
  for (const server of servers) {
    await server.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  for (const server of servers) {
    await server.close();
  }
  process.exit(0);
});

startServers().catch((err) => {
  console.error('Fatal error starting multi-port server:', err);
  process.exit(1);
});

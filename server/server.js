const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('===========================================================');
  console.log('   STORYLAB VOICE - WEB TECHNOLOGY (2310362L) SERVER       ');
  console.log('   MERN Stack Backend & RESTful CRUD Service Engine        ');
  console.log('===========================================================');

  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`[Express & Node.js] Server is running on: http://localhost:${PORT}`);
    console.log(`[RESTful API Root] Explore endpoints at: http://localhost:${PORT}/api`);
    console.log(`[Bootstrap Portal] Practical 01 & 02:    http://localhost:${PORT}/wt-portal/index.html`);
    console.log(`[React.js Portal]  Practical 03:         http://localhost:${PORT}/react-app/index.html`);
    console.log('===========================================================');
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => console.log('HTTP server closed'));
  });
}

const { seedInitialData } = require('./seed');
seedInitialData();

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

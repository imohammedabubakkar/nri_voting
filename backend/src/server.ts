import { app } from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { Admin } from './models/Admin.js';

async function startServer() {
  try {
    // Attempt DB connection
    try {
      await connectDB();

      // Ensure default admin user is initialized
      const defaultAdmin = await Admin.findOne({
        username: config.adminDefaultUsername.toLowerCase(),
      });
      if (!defaultAdmin) {
        await Admin.create({
          username: config.adminDefaultUsername,
          password: config.adminDefaultPassword,
          role: 'admin',
        });
        console.log(`[Bootstrap] Default admin created: ${config.adminDefaultUsername}`);
      }
    } catch (dbErr: any) {
      console.warn(`[Server] Warning: MongoDB connection failed (${dbErr.message}). API server will continue running.`);
      console.warn(`[Server] Please ensure MongoDB is started (or configure MONGO_URI in .env).`);
    }

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 Election Portal Backend API is running!`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🏥 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`🛡️  Admin Default: ${config.adminDefaultUsername} / ${config.adminDefaultPassword}`);
      console.log(`====================================================`);
    });

    // Graceful shutdown
    const handleShutdown = (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();

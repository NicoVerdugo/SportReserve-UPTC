import { connectDB } from './database/connection';
import app from './app';
import { config } from './config/env';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log('─────────────────────────────────────────────');
      console.log(`  SportReserve UPTC API`);
      console.log(`  Environment : ${config.nodeEnv}`);
      console.log(`  Port        : ${config.port}`);
      console.log(`  API Docs    : http://localhost:${config.port}/api/docs`);
      console.log(`  Health      : http://localhost:${config.port}/health`);
      console.log('─────────────────────────────────────────────');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('Unhandled Rejection:', reason);
      shutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

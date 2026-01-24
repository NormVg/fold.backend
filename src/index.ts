import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { apiRateLimiter } from "./middleware/rateLimit.js";
import routes from "./routes/index.js";

const app = express();

// ============ Security Middleware ============
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============ Body Parsing Middleware ============
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ============ Rate Limiting ============
app.use("/api", apiRateLimiter);

// ============ API Routes ============
app.use("/api", routes);

// ============ Error Handling ============
app.use(notFoundHandler);
app.use(errorHandler);

// ============ Server Startup ============
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Fold Backend API Server                               ║
║                                                            ║
║   Environment: ${env.NODE_ENV.padEnd(40)}║
║   Port: ${String(env.PORT).padEnd(46)}║
║   API: http://localhost:${env.PORT}/api${"".padEnd(28)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("HTTP server closed");
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("Forced shutdown due to timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;

import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // All backend logic is handled by Supabase
  // This server only serves the frontend static files
  
  const httpServer = createServer(app);

  return httpServer;
}

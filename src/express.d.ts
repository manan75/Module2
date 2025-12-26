import "express";

declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        roles: string[];
        owner: string;
      };
    }
  }
}

export {};
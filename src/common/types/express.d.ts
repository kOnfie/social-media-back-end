declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionToken?: string;
    }
  }
}

export {};

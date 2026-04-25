import mongoose from "mongoose";
import Role from "./src/constants/enums/roles";

declare global {
  namespace Express {
    interface Request {
      userId: mongoose.Types.ObjectId;
      sessionId: mongoose.Types.ObjectId;
      role: Role;
      verified: Boolean;
    }
  }
}

export {};

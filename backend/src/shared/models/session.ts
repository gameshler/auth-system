import mongoose from "mongoose";
import { sevenDaysFromNow } from "../utils/date";
import { sessionDocument } from "../../constants/interfaces/model.interface";

const sessionSchema = new mongoose.Schema<sessionDocument>(
  {
    userId: {
      ref: "User",
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userAgent: { type: String },
    ip: { type: String },
    previousRefreshToken: {
      type: String,
    },
    refreshToken: { type: String, required: true },
    tokenRotatedAt: {
      type: Date,
    },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: {
      type: Date,
      required: true,
      default: sevenDaysFromNow,
    },
  },
  { versionKey: false },
);

sessionSchema.index({ _id: 1, refreshToken: 1 });
sessionSchema.index({ userId: 1, expiresAt: 1, createdAt: -1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const sessionModel = mongoose.model<sessionDocument>("Session", sessionSchema);

export default sessionModel;

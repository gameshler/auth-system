import mongoose from "mongoose";
import { sevenDaysFromNow } from "../utils/date";
import { sessionDocument } from "../../constants/interfaces/model.interface";

const sessionSchema = new mongoose.Schema<sessionDocument>({
  userId: {
    ref: "User",
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },
  userAgent: { type: String },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true, default: sevenDaysFromNow },
});

const sessionModel = mongoose.model<sessionDocument>("Session", sessionSchema);

export default sessionModel;

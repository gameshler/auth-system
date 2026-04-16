import mongoose from "mongoose";
import { verificationCodeDocument } from "../../constants/interfaces/model.interface";

const verificationCodeSchema = new mongoose.Schema<verificationCodeDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const verificationCodeModel = mongoose.model<verificationCodeDocument>(
  "VerificationCode",
  verificationCodeSchema,
  "verification_codes"
);
export default verificationCodeModel;

import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";
import {
  MfaDocument,
  UserDocument,
} from "../../constants/interfaces/model.interface";
import Role from "../../constants/enums/roles";
import appAssert from "../utils/appAssert";
import { TOO_MANY_REQUESTS } from "../../constants/http";
import AppErrorCode from "../../constants/enums/AppErrorCode";

const mfaSchema = new mongoose.Schema<MfaDocument>(
  {
    enabled: { type: Boolean, default: false, index: true },
    secret: { type: String, select: false },
    tempSecret: { type: String, select: false },
    backupCodes: { type: [String], default: [], select: false },
    lastUsedStep: { type: Number, default: 0, select: false },
    failedAttempts: { type: Number, default: 0, select: false },
    lockoutUntil: { type: Date, default: null, select: false },
    tempSecretCreatedAt: { type: Date, default: null, select: false },
  },
  { _id: false, versionKey: false },
);

const userSchema = new mongoose.Schema<UserDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    verified: { type: Boolean, required: true, default: false },
    mfa: { type: mfaSchema, default: {} },

    role: { type: String, enum: Object.values(Role), default: Role.USER },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await hashValue(this.password);
});

userSchema.pre(["find", "findOne", "findOneAndUpdate"], async function () {
  this.select("+mfa.lockoutUntil");
});

userSchema.methods.comparePassword = async function (val: string) {
  return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password;
  if (user.mfa) {
    delete user.mfa.secret;
    delete user.mfa.tempSecret;
    delete user.mfa.backupCodes;
    delete user.mfa.failedAttempts;
    delete user.mfa.lockoutUntil;
  }
  return user;
};

userSchema.methods.checkLockout = function () {
  if (this.mfa?.lockoutUntil && this.mfa.lockoutUntil > new Date()) {
    const remainingTime = Math.ceil(
      (this.mfa.lockoutUntil.getTime() - Date.now()) / 1000 / 60,
    );
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      `Too many failed attempts. Try again in ${remainingTime} minutes.`,
      AppErrorCode.TooManyRequests,
    );
  }
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;

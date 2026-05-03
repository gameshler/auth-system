import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";
import { UserDocument } from "../../constants/interfaces/model.interface";
import Role from "../../constants/enums/roles";

const userSchema = new mongoose.Schema<UserDocument>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, required: true, default: false },
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
      tempSecret: { type: String, select: false },
      backupCodes: { type: [String], select: false },
      lastUsedStep: { type: Number, default: 0 },
      failedAttempts: { type: Number, default: 0 },
      lockoutUntil: { type: Date, default: null },
    },

    role: { type: String, enum: Object.values(Role), default: Role.USER },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await hashValue(this.password);
});

userSchema.methods.comparePassword = async function (val: string) {
  return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password;
  delete user.mfa.secret;
  delete user.mfa.tempSecret;
  delete user.mfa.backupCodes;
  return user;
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;

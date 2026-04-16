import catchErrors from "../../shared/utils/catchErrors";
import UserModel from "../../shared/models/user";
import appAssert from "../../shared/utils/appAssert";
import { NOT_FOUND, OK } from "../../constants/http";

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await UserModel.findById(req.userId);
  appAssert(user, NOT_FOUND, "User not found");
  return res.status(OK).json({ user: user.omitPassword() });
});

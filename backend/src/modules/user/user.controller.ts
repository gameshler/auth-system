import catchErrors from "../../shared/utils/catchErrors";
import UserModel from "../../shared/models/user";
import appAssert from "../../shared/utils/appAssert";
import { NOT_FOUND, OK } from "../../constants/http";
import { ErrorMessages } from "../../shared/utils/errorMessages";
import AppErrorCode from "../../constants/enums/AppErrorCode";

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await UserModel.findById(req.userId);
  appAssert(
    user,
    NOT_FOUND,
    ErrorMessages.AccountNotFound,
    AppErrorCode.AccountNotFound,
  );
  return res.status(OK).json({ user: user.omitPassword() });
});

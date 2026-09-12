import { z } from "zod";
import catchErrors from "../../../shared/utils/catchErrors";
import sessionModel from "../../../shared/models/session";
import { NOT_FOUND, OK } from "../../../constants/http";
import appAssert from "../../../shared/utils/appAssert";
import { ErrorMessages } from "../../../shared/utils/errorMessages";
import AppErrorCode from "../../../constants/enums/AppErrorCode";

export const getSessionHandler = catchErrors(async (req, res) => {
  const sessions = await sessionModel
    .find(
      {
        userId: req.userId,
        expiresAt: { $gt: new Date() },
      },
      { _id: 1, userAgent: 1, ip: 1, createdAt: 1 },
      {
        sort: { createdAt: -1 },
      },
    )
    .limit(20)
    .lean();
  return res.status(OK).json(
    sessions.map((session) => ({
      _id: session._id,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
      ...(session._id.equals(req.sessionId) && {
        isCurrent: true,
      }),
    })),
  );
});

export const deleteSessionHandler = catchErrors(async (req, res) => {
  const sessionId = z.string().parse(req.params.id);

  const { deletedCount } = await sessionModel.deleteOne({
    _id: sessionId,
    userId: req.userId,
  });

  appAssert(
    deletedCount === 1,
    NOT_FOUND,
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.NotFound,
  );

  return res.status(OK).json({ message: "Session removed" });
});

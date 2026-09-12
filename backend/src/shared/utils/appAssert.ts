import assert from "node:assert";
import AppError from "./AppError";
import { AppAssert } from "../../constants/types/utils.types";

const appAssert: AppAssert = (
  condition,
  httpStatusCode,
  message,
  appErrorCode
) => assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;

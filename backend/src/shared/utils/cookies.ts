import { CookieOptions, Response } from "express";
import { fifteenminutesFromNow, sevenDaysFromNow } from "./date";
import { NODE_ENV } from "../../constants/env";
import { Params } from "../../constants/types/utils.types";

export const REFRESH_PATH = "/api/v1/auth/refresh";
const secure = NODE_ENV !== "development";

export const defaults: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure,
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: fifteenminutesFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: sevenDaysFromNow(),
  path: REFRESH_PATH,
});

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCookies = (res: Response) =>
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken", { path: REFRESH_PATH });

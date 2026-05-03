export const fifteenminutesFromNow = () =>
  new Date(Date.now() + 15 * 60 * 1000);
export const tenminutesFromNow = () => new Date(Date.now() + 10 * 60 * 1000);
export const fiveminutesFromNow = () => new Date(Date.now() + 5 * 60 * 1000);
export const sevenDaysFromNow = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const fiveMinutesAgo = () => new Date(Date.now() - 5 * 60 * 1000);

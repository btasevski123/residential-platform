export const APP_NAME = "NIVIA";
export const APP_TAGLINE = "Connected living, simplified.";

export const SESSION_COOKIE_NAME = "nivia_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getAppUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

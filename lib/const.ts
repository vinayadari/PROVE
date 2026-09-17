export const COOKIE_NAME = "prove_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const getLoginUrl = () => {
  const oauthPortalUrl = process.env.NEXT_PUBLIC_OAUTH_PORTAL_URL;
  const appId = process.env.NEXT_PUBLIC_APP_ID;

  if (!oauthPortalUrl || !appId || typeof window === "undefined") {
    return "#";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

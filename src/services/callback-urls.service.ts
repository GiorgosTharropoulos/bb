import { config } from "~/config.js";

const relativeUrlPattern = /^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%/]*$/;

export function checkIfCallbackUrlIsTrusted(callbackUrl: string) {
  if (callbackUrl.startsWith("/")) {
    return relativeUrlPattern.test(callbackUrl);
  }

  try {
    const origin = new URL(callbackUrl).origin;
    return config.trustedOrigins.includes(origin);
  } catch {
    return false;
  }
}

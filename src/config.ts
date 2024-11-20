import { env } from "~/env.js";
export const config = {
  session: {
    /**
     * The number of days until a session expires.
     */
    expiration: 7,
    /**
     * The number of days before a session expires that it should be refreshed.
     */
    fresh: 3,
  },
  trustedOrigins: [env.APP_URL],
};

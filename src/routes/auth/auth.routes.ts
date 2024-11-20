import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createErrorSchema } from "stoker/openapi/schemas";
import { env } from "~/env.js";
import { createRouter } from "~/lib/create-app.js";
import { makeErrorResponse } from "~/lib/errors.js";
import { resend } from "~/lib/mail.js";
import { checkIfCallbackUrlIsTrusted } from "~/services/callback-urls.service.js";
import { getOrCreateMagicLinkToken } from "~/services/magic-links.service.js";
import { errorSchema } from "~/utils/schema/common-responses.js";
import { sendMagicLinkSchema } from "./schema.js";

export const login = createRoute({
  method: "post",
  path: "api/auth/signi-in/magic-link",
  summary: "Send a magic link to the user's email",
  description:
    "Send a magic link to the user's email to begin the login process",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: sendMagicLinkSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "The magic link was sent",
    },
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(sendMagicLinkSchema),
      "The validation error(s)",
    ),
    [HttpStatusCodes.FORBIDDEN]: {
      description: "The callback URL is not trusted",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

export const authRouter = createRouter().openapi(login, async (c) => {
  const logger = c.get("logger");
  const { callbackURL, email } = c.req.valid("json");

  const isCallbackUrlTrusted = checkIfCallbackUrlIsTrusted(callbackURL);
  if (!isCallbackUrlTrusted) {
    logger.error({ callbackURL }, "The callback URL is not trusted");
    return makeErrorResponse(
      c,
      HttpStatusCodes.FORBIDDEN,
      "The callback URL is not trusted",
    );
  }

  const token = await getOrCreateMagicLinkToken(email);
  const url = `${env.APP_URL}/api/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(
    callbackURL,
  )}`;

  logger.info({ email, url }, "Sending magic link");
  const { data, error } = await resend.emails.send({
    from: "Acme <hello@gtharropoulos.com>",
    to: [email],
    subject: "Magic link",
    text: `Click here to login: ${url}`,
  });

  if (error) {
    logger.error({ email, error }, "Failed to send magic link");
    return makeErrorResponse(
      c,
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to send magic link",
    );
  }

  return c.json({ success: true }, HttpStatusCodes.OK);
});

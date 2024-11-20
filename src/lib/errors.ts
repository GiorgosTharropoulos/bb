import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import type * as HttpStatusCodes from "stoker/http-status-codes";

export function makeErrorResponse(
  c: Context,
  status: (typeof HttpStatusCodes)[keyof typeof HttpStatusCodes],
  message: string,
) {
  return c.json(
    {
      success: false,
      error: {
        message,
        status,
      },
    },
    status as StatusCode,
  );
}

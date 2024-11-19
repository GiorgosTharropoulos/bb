import crypto from "node:crypto";
import { pinoLogger as _pinoLogger } from "hono-pino";
import { logger } from "~/lib/logger.js";

export function pinoLogger() {
  return _pinoLogger({
    pino: logger,
    http: {
      reqId: () => crypto.randomUUID(),
    },
  });
}

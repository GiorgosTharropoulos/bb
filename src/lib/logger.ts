import { pino } from "pino";
import pretty from "pino-pretty";
import { env } from "~/env.js";

export const logger = pino(
  {
    level: env.LOG_LEVEL,
  },
  pretty({
    colorize: true,
  }),
);

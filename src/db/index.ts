import type { Logger as DrizzleLogger } from "drizzle-orm/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "~/env.js";
import { logger } from "~/lib/logger.js";
import * as schema from "./schema.js";

class Logger implements DrizzleLogger {
  logQuery(query: string, params: unknown[]): void {
    logger.debug({ query, params });
  }
}

export const db = drizzle(env.DATABASE_URL, { schema, logger: new Logger() });
export { schema };

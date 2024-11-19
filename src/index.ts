import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { pinoLogger } from "./middlewares/pino-logger.js";

const app = new Hono();

app.use(pinoLogger());

app.get("/", async (c) => {
  return c.text("Hello from Hono!");
});

const port = env.PORT;
logger.info(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

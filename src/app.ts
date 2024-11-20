import { configureOpenAPI } from "./lib/configure-open-api.js";
import { createApp } from "./lib/create-app.js";
import { authRouter } from "./routes/auth/auth.routes.js";

export const app = createApp();

configureOpenAPI(app);

const _appType = app.route("/", authRouter);

export type App = typeof _appType;

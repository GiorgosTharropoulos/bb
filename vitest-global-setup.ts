import { execSync } from "node:child_process";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

let teardown = false;

export default async function () {
  const container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUri();

  execSync("pnpm drizzle-kit push", {
    stdio: "inherit",
  });

  return async () => {
    if (teardown) {
      throw new Error("Teardown called twice");
    }
    teardown = true;
    await container.stop();
  };
}

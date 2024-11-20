import { eq } from "drizzle-orm";
import { TimeSpan, createDate } from "oslo";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, schema } from "~/db/index.js";
import {
  createVerificationToken,
  getOrCreateMagicLinkToken,
} from "~/services/magic-links.service.js";

beforeEach(async () => {
  await db.delete(schema.verificationTokens).execute();
});

const email = "email@example.com";
describe("magic-links.service", () => {
  describe("createVerificationToken", () => {
    it("should create a new verification token", async (ctx) => {
      vi.useFakeTimers();
      ctx.onTestFinished(() => {
        vi.useRealTimers();
      });
      const now = new Date();
      vi.setSystemTime(now);

      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

      const token = await createVerificationToken(email);

      expect(token).toHaveLength(32);

      const [verificationToken] = await db
        .select()
        .from(schema.verificationTokens)
        .where(eq(schema.verificationTokens.id, token));

      expect(verificationToken.id).toBe(token);
      expect(verificationToken.value).toBe(email);
      expect(verificationToken.type).toBe("magic-link");
      expect(verificationToken.expiresAt).toEqual(fiveMinutesLater);
    });
  });

  describe("getOrCreateMagicLinkToken", () => {
    it("should return an existing token if it is not expired", async () => {
      const id = "existing-token";
      await db.insert(schema.verificationTokens).values({
        id,
        expiresAt: createDate(new TimeSpan(5, "m")),
        type: "magic-link",
        value: email,
      });

      const token = await getOrCreateMagicLinkToken(email);

      expect(token).toBe(id);
    });

    it("should create a new token if it does not exist", async (ctx) => {
      expect(
        await db.select().from(schema.verificationTokens).execute(),
      ).toHaveLength(0);

      vi.useFakeTimers();
      ctx.onTestFinished(() => {
        vi.useRealTimers();
      });
      const now = new Date();
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
      vi.setSystemTime(now);

      const token = await getOrCreateMagicLinkToken(email);

      const [verificationToken] = await db
        .select()
        .from(schema.verificationTokens)
        .where(eq(schema.verificationTokens.id, token));

      expect(verificationToken.id).toBe(token);
      expect(verificationToken.value).toBe(email);
      expect(verificationToken.type).toBe("magic-link");
      expect(verificationToken.expiresAt).toEqual(fiveMinutesLater);
      expect(
        await db.select().from(schema.verificationTokens).execute(),
      ).toHaveLength(1);
    });

    it("should delete the existing token if it is expired and create a new one", async () => {
      await db.insert(schema.verificationTokens).values({
        id: "expired-token",
        expiresAt: createDate(new TimeSpan(-5, "m")),
        type: "magic-link",
        value: email,
      });

      const token = await getOrCreateMagicLinkToken(email);

      const [verificationToken] = await db
        .select()
        .from(schema.verificationTokens)
        .where(eq(schema.verificationTokens.id, token));

      expect(verificationToken.id).toBe(token);
      expect(verificationToken.value).toBe(email);
      expect(verificationToken.type).toBe("magic-link");
      expect(
        await db
          .select()
          .from(schema.verificationTokens)
          .where(eq(schema.verificationTokens.value, email)),
      ).toEqual([verificationToken]);
    });
  });
});

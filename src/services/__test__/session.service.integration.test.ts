import { eq } from "drizzle-orm";
import { TimeSpan, createDate } from "oslo";
import { afterEach, describe, expect, it } from "vitest";
import { config } from "~/config.js";
import { db, schema } from "~/db/index.js";
import {
  createSession,
  invalidateSession,
  validateSession,
} from "~/services/session.service.js";
import { generateId } from "~/utils/id.js";

const userEmail = "example@exmaple.com";

afterEach(async () => {
  await db.delete(schema.sessions).execute();
  await db.delete(schema.users).execute();
});

describe("session service", () => {
  describe("createSession", () => {
    it("should create a session with the correct properties", async () => {
      const userId = generateId(30);
      const ipAddress = "127.0.0.1";
      const userAgent = "Mozilla/5.0";

      await db
        .insert(schema.users)
        .values({ id: userId, email: userEmail })
        .execute();

      const session = await createSession({
        userId,
        ipAddress,
        userAgent,
      });

      expect(session).toHaveProperty("id");
      expect(session.userId).toBe(userId);
      expect(session.ipAddress).toBe(ipAddress);
      expect(session.userAgent).toBe(userAgent);
      expect(session.expiresAt).toBeInstanceOf(Date);

      const storedSession = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, session.id));

      expect(storedSession.at(0)).toEqual(session);
    });
  });

  describe("invalidateSession", () => {
    it("should invalidate a session", async () => {
      const userId = generateId(30);
      const ipAddress = "127.0.0.1";
      const userAgent = "Mozilla/5.0";

      await db
        .insert(schema.users)
        .values({ id: userId, email: userEmail })
        .execute();

      const session = await createSession({
        userId,
        ipAddress,
        userAgent,
      });

      await invalidateSession(session.id);

      const storedSession = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, session.id));

      expect(storedSession).toHaveLength(0);
    });
  });

  describe("validateSession", () => {
    it("should return null if the session does not exist", async () => {
      const sessionId = generateId(30);

      const { session, user } = await validateSession(sessionId);

      expect(session).toBeNull();
      expect(user).toBeNull();
    });

    it("should delete the session if it has expired", async () => {
      const userId = generateId(30);

      await db
        .insert(schema.users)
        .values({ id: userId, email: userEmail })
        .execute();
      const [{ id: sessionId }] = await db
        .insert(schema.sessions)
        .values({
          id: generateId(30),
          userId,
          expiresAt: createDate(new TimeSpan(-1, "d")),
        })
        .returning()
        .execute();

      const { session, user } = await validateSession(sessionId);

      const storedSession = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId));

      expect(session).toBeNull();
      expect(user).toBeNull();
      expect(storedSession).toHaveLength(0);
    });

    it("should update the session expiration date if it is within 3 days of expiring", async () => {
      const userId = generateId(30);

      await db
        .insert(schema.users)
        .values({ id: userId, email: userEmail })
        .execute();
      const [{ id: sessionId }] = await db
        .insert(schema.sessions)
        .values({
          id: generateId(30),
          userId,
          expiresAt: createDate(new TimeSpan(config.session.fresh - 1, "d")),
        })
        .returning()
        .execute();

      const { session, user } = await validateSession(sessionId);

      expect(session).not.toBeNull();
      expect(user).not.toBeNull();
      const [storedSession] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId));

      expect(
        Math.abs(
          (storedSession.expiresAt.getTime() ?? 0) -
            createDate(new TimeSpan(config.session.expiration, "d")).getTime(),
        ),
      ).toBeLessThan(1000);
    });
  });
});

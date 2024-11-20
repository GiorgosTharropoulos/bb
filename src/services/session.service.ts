import { eq } from "drizzle-orm";
import { TimeSpan, createDate, isWithinExpirationDate } from "oslo";
import type { z } from "zod";
import { config } from "~/config.js";
import { db, schema } from "~/db/index.js";
import { insertSessionSchema } from "~/db/schema.js";
import type { SessionDb } from "~/db/schema.js";
import { generateId } from "~/utils/id.js";

const createSessionSchema = insertSessionSchema.omit({
  id: true,
  expiresAt: true,
});
export type CreateSession = z.infer<typeof createSessionSchema>;

export async function createSession({
  userId,
  ipAddress = null,
  userAgent = null,
}: CreateSession) {
  const sessionId = generateId(30);
  const session: SessionDb = {
    id: sessionId,
    userId,
    ipAddress,
    userAgent,
    expiresAt: createDate(new TimeSpan(config.session.expiration, "d")),
  };

  await db.insert(schema.sessions).values(session).execute();
  return session;
}
export async function validateSession(sessionId: string) {
  const result = await db
    .select({ user: schema.users, session: schema.sessions })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.id, sessionId));

  if (result.length < 1) {
    return { session: null, user: null };
  }

  const { user, session } = result[0];

  if (!isWithinExpirationDate(session.expiresAt)) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, session.id));
    return { session: null, user: null };
  }

  const threeDaysFromNow = createDate(new TimeSpan(config.session.fresh, "d"));
  if (session.expiresAt <= threeDaysFromNow) {
    session.expiresAt = createDate(
      new TimeSpan(config.session.expiration, "d"),
    );
    await db
      .update(schema.sessions)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(schema.sessions.id, session.id));
  }

  return { session, user };
}

export async function invalidateSession(sessionId: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
}

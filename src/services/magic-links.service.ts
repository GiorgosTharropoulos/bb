import { and, eq } from "drizzle-orm";
import { TimeSpan, createDate, isWithinExpirationDate } from "oslo";
import { alphabet, generateRandomString } from "oslo/crypto";
import { db, schema } from "~/db/index.js";

export async function getOrCreateMagicLinkToken(email: string) {
  const existingToken = await db
    .select()
    .from(schema.verificationTokens)
    .where(
      and(
        eq(schema.verificationTokens.value, email),
        eq(schema.verificationTokens.type, "magic-link"),
      ),
    );

  if (existingToken.length === 0) {
    return await createVerificationToken(email);
  }

  const token = existingToken[0];

  if (!isWithinExpirationDate(token.expiresAt)) {
    await db
      .delete(schema.verificationTokens)
      .where(eq(schema.verificationTokens.id, token.id));
    return await createVerificationToken(email);
  }

  return token.id;
}

export async function createVerificationToken(email: string) {
  const token = generateRandomString(32, alphabet("A-Z"));
  await db.insert(schema.verificationTokens).values({
    id: token,
    value: email,
    expiresAt: createDate(new TimeSpan(5, "m")),
    type: "magic-link",
  });

  return token;
}

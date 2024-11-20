import type { InferSelectModel } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email.email(),
}).omit({
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const insertSessionSchema = createInsertSchema(sessions, {
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});
export const selectSessionSchema = createSelectSchema(sessions);

export type SessionDb = InferSelectModel<typeof sessions>;

export const verificationTokens = pgTable("verification_tokens", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  type: text("type").notNull().$type<"magic-link">().default("magic-link"),
});

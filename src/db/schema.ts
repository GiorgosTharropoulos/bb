import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const SubscriptionStatus = {
  Active: "active",
  OverduePaymentOpen: "overdue_payment_open",
  PendingCancel: "pending_cancel",
  OverduePaymentDisabled: "overdue_payment_disabled",
  Paused: "paused",
  Cancelled: "cancelled",
  Blocked: "blocked",
  TrialActive: "trial_active",
  TrialEnded: "trial_ended",
} as const;
type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const subscription = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text().notNull(),
  active: boolean("active").notNull(),
  status: text("status").$type<SubscriptionStatus>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSubscriptionSchema = createInsertSchema(subscription).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  active: true,
});

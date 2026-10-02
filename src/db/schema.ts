import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  telegramChatId: text("telegram_chat_id"),
  notifyByEmail: integer("notify_by_email", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    templateId: text("template_id").notNull(),
    recipientName: text("recipient_name").notNull(),
    question: text("question").notNull(),
    message: text("message"),
    eventDate: text("event_date"),
    eventTime: text("event_time"),
    place: text("place"),
    /** allow: звичайні кнопки; runaway: кнопка «ні» тікає від курсора, відповісти «ні» неможливо */
    noMode: text("no_mode", { enum: ["allow", "runaway"] })
      .notNull()
      .default("allow"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("invitations_user_idx").on(t.userId)],
);

export const responses = sqliteTable(
  "responses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    answer: text("answer", { enum: ["yes", "no"] }).notNull(),
    comment: text("comment"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("responses_invitation_idx").on(t.invitationId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  invitations: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  author: one(users, { fields: [invitations.userId], references: [users.id] }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  invitation: one(invitations, {
    fields: [responses.invitationId],
    references: [invitations.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type Answer = Response["answer"];
export type NoMode = Invitation["noMode"];

import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export const universityEnum = pgEnum("university", [
	"BRACU",
	"NSU",
	"UIU",
	"AUST",
	"EWU",
	"DIU",
]);

// ─────────────────────────────────────────────
// Better Auth core tables (unchanged, plus app fields on `user`)
// ─────────────────────────────────────────────

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),

	// ── app-specific fields, populated by the "before user creation" hook ──
	studentId: text("student_id"),
	university: universityEnum("university"),
});

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ─────────────────────────────────────────────
// App tables
// ─────────────────────────────────────────────

export const snitch = pgTable(
	"snitch",
	{
		id: text("id").primaryKey(),
		studentName: text("student_name").notNull(),
		studentId: text("student_id").notNull(),
		university: universityEnum("university").notNull(),
		createdById: text("created_by_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// (studentId + university) must be unique — same ID can exist
		// at two different universities, but not twice within one.
		unique("snitch_studentId_university_unique").on(
			table.studentId,
			table.university,
		),
		index("snitch_university_idx").on(table.university),
		index("snitch_createdById_idx").on(table.createdById),
	],
);

export const review = pgTable(
	"review",
	{
		id: text("id").primaryKey(),
		snitchId: text("snitch_id")
			.notNull()
			.references(() => snitch.id, { onDelete: "cascade" }),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		teamwork: integer("teamwork").notNull(),
		communication: integer("communication").notNull(),
		reliability: integer("reliability").notNull(),
		behaviour: integer("behaviour").notNull(),

		description: text("description").notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// one review per user per snitch
		unique("review_snitchId_authorId_unique").on(
			table.snitchId,
			table.authorId,
		),
		index("review_snitchId_idx").on(table.snitchId),
		index("review_authorId_idx").on(table.authorId),
	],
);

// ─────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	snitchesCreated: many(snitch),
	reviewsWritten: many(review),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const snitchRelations = relations(snitch, ({ one, many }) => ({
	createdBy: one(user, {
		fields: [snitch.createdById],
		references: [user.id],
	}),
	reviews: many(review),
}));

export const reviewRelations = relations(review, ({ one }) => ({
	snitch: one(snitch, {
		fields: [review.snitchId],
		references: [snitch.id],
	}),
	author: one(user, {
		fields: [review.authorId],
		references: [user.id],
	}),
}));

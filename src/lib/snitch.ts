import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "#/db/index.ts";
import { anonymousPost, review, snitch, user } from "#/db/schema";
import { auth } from "#/lib/auth";

// ─────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────

type Ratings = {
	teamwork: number;
	communication: number;
	reliability: number;
	behaviour: number;
};

function ratingsAreValid(r: Ratings) {
	return [r.teamwork, r.communication, r.reliability, r.behaviour].every(
		(v) => Number.isInteger(v) && v >= 1 && v <= 5,
	);
}

// Postgres unique_violation error code. Both node-postgres and Neon's
// http driver surface this the same way, sometimes nested under `.cause`.
function isUniqueViolation(err: unknown): boolean {
	const code =
		(err as any)?.code ?? (err as any)?.cause?.code ?? undefined;
	return code === "23505";
}

async function hasUsedAnonymous(userId: string) {
	const [row] = await db
		.select({ userId: anonymousPost.userId })
		.from(anonymousPost)
		.where(eq(anonymousPost.userId, userId))
		.limit(1);
	return !!row;
}

// ─────────────────────────────────────────────
// getAnonymousStatus
// Lets the create-snitch modal check, when the user flips the anonymous
// toggle, whether their one-time anonymous post is still available.
// This is only a convenience check — createSnitch enforces the rule.
// ─────────────────────────────────────────────

export const getAnonymousStatus = createServerFn({ method: "POST" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			return { ok: false as const, reason: "unauthenticated" as const };
		}
		if (!session.user.emailVerified) {
			return { ok: false as const, reason: "unverified" as const };
		}

		const used = await hasUsedAnonymous(session.user.id);
		return { ok: true as const, available: !used };
	},
);

// ─────────────────────────────────────────────
// createSnitch
// First post for a student — creates the snitch AND the first review
// in ONE atomic transaction (db.batch). If (studentId, university)
// already exists, nothing is written and the existing snitch id is
// returned.
//
// Anonymous posts: the batch also inserts a row into anonymous_post, whose
// PRIMARY KEY is user_id. A user can only ever have one such row, so the
// database itself rejects a second anonymous post — even if two requests
// race. Because everything is one transaction, a failed post (e.g.
// duplicate student ID) never uses up the user's anonymous slot.
// ─────────────────────────────────────────────

type CreateSnitchInput = Ratings & {
	studentName: string;
	studentId: string;
	description: string;
	anonymous?: boolean;
};

export const createSnitch = createServerFn({ method: "POST" })
	.validator((data: CreateSnitchInput) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			return { ok: false as const, reason: "unauthenticated" as const };
		}
		if (!session.user.emailVerified) {
			return { ok: false as const, reason: "unverified" as const };
		}
		if (!session.user.university) {
			return { ok: false as const, reason: "no_university" as const };
		}

		// Strict: only a real boolean is accepted. Anything else is rejected
		// rather than silently treated as "not anonymous".
		if (
			data.anonymous !== undefined &&
			typeof data.anonymous !== "boolean"
		) {
			return { ok: false as const, reason: "invalid_input" as const };
		}
		const anonymous = data.anonymous === true;

		const studentName = data.studentName?.trim();
		const studentId = data.studentId?.trim();
		const description = data.description?.trim();

		if (!studentName || !studentId || !description) {
			return { ok: false as const, reason: "invalid_input" as const };
		}
		if (!ratingsAreValid(data)) {
			return { ok: false as const, reason: "invalid_rating" as const };
		}

		// Fast, friendly check. NOT the real enforcement — the primary key on
		// anonymous_post.user_id is. This just avoids a pointless transaction.
		if (anonymous && (await hasUsedAnonymous(session.user.id))) {
			return {
				ok: false as const,
				reason: "anonymous_already_used" as const,
			};
		}

		const snitchId = randomUUID();
		const university = session.user
			.university as (typeof snitch.$inferInsert)["university"];

		const insertSnitch = db.insert(snitch).values({
			id: snitchId,
			studentName,
			studentId,
			university,
			createdById: session.user.id,
		});

		const insertReview = db.insert(review).values({
			id: randomUUID(),
			snitchId,
			authorId: session.user.id,
			teamwork: data.teamwork,
			communication: data.communication,
			reliability: data.reliability,
			behaviour: data.behaviour,
			description,
			anonymous,
		});

		try {
			if (anonymous) {
				const claimAnonymous = db
					.insert(anonymousPost)
					.values({ userId: session.user.id });
				// Order matters: statements run in sequence in one transaction.
				await db.batch([insertSnitch, claimAnonymous, insertReview]);
			} else {
				await db.batch([insertSnitch, insertReview]);
			}
		} catch (err) {
			if (isUniqueViolation(err)) {
				// The whole transaction rolled back. Work out which rule fired.
				if (anonymous && (await hasUsedAnonymous(session.user.id))) {
					return {
						ok: false as const,
						reason: "anonymous_already_used" as const,
					};
				}

				const [existing] = await db
					.select({ id: snitch.id })
					.from(snitch)
					.where(
						and(
							eq(snitch.university, university),
							eq(snitch.studentId, studentId),
						),
					)
					.limit(1);

				return {
					ok: false as const,
					reason: "already_exists" as const,
					existingSnitchId: existing?.id,
				};
			}
			throw err;
		}

		return { ok: true as const, snitchId };
	});

// ─────────────────────────────────────────────
// searchSnitches
// Public read — no auth required. Matches on name or student ID,
// scoped to one university.
// ─────────────────────────────────────────────

type SearchSnitchesInput = {
	university: string;
	query: string;
};

export const searchSnitches = createServerFn({ method: "GET" })
	.validator((data: SearchSnitchesInput) => data)
	.handler(async ({ data }) => {
		const q = data.query.trim();
		if (!q) return [];

		const pattern = `%${q}%`;

		const rows = await db
			.select({
				id: snitch.id,
				studentName: snitch.studentName,
				studentId: snitch.studentId,
				reviewCount: sql<number>`count(${review.id})`.mapWith(Number),
			})
			.from(snitch)
			.leftJoin(review, eq(review.snitchId, snitch.id))
			.where(
				and(
					eq(
						snitch.university,
						data.university as (typeof snitch.$inferInsert)["university"],
					),
					or(
						ilike(snitch.studentName, pattern),
						ilike(snitch.studentId, pattern),
					),
				),
			)
			.groupBy(snitch.id)
			.limit(10);

		return rows;
	});

// ─────────────────────────────────────────────
// getSnitchDetail
// Public read — full profile with averaged ratings and all reviews.
//
// PRIVACY: this response is sent to every visitor, so it must never
// contain anything that identifies an anonymous author:
//   • the snitch's createdById is NOT selected
//   • authorId is never returned; the server computes `isMine` instead
//   • authorName is null for anonymous reviews
// It is a POST so per-viewer data (isMine) can never be cached/shared.
// ─────────────────────────────────────────────

export const getSnitchDetail = createServerFn({ method: "POST" })
	.validator((data: { snitchId: string }) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		const viewerId = session?.user.id ?? null;

		const [snitchRow] = await db
			.select({
				id: snitch.id,
				studentName: snitch.studentName,
				studentId: snitch.studentId,
				university: snitch.university,
				createdAt: snitch.createdAt,
			})
			.from(snitch)
			.where(eq(snitch.id, data.snitchId))
			.limit(1);

		if (!snitchRow) return null;

		const rows = await db
			.select({
				id: review.id,
				authorId: review.authorId,
				teamwork: review.teamwork,
				communication: review.communication,
				reliability: review.reliability,
				behaviour: review.behaviour,
				description: review.description,
				edited: review.edited,
				anonymous: review.anonymous,
				createdAt: review.createdAt,
				updatedAt: review.updatedAt,
				authorName: user.name,
			})
			.from(review)
			.innerJoin(user, eq(review.authorId, user.id))
			.where(eq(review.snitchId, data.snitchId))
			.orderBy(sql`${review.createdAt} desc`);

		// Build each review explicitly (no spreading) so authorId can't leak.
		const reviews = rows.map((r) => ({
			id: r.id,
			teamwork: r.teamwork,
			communication: r.communication,
			reliability: r.reliability,
			behaviour: r.behaviour,
			description: r.description,
			edited: r.edited,
			anonymous: r.anonymous,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
			isMine: viewerId !== null && r.authorId === viewerId,
			authorName: r.anonymous ? null : r.authorName,
		}));

		const count = reviews.length;
		const sum = (key: keyof Ratings) =>
			reviews.reduce((total, r) => total + r[key], 0);

		return {
			snitch: snitchRow,
			reviews,
			averages: count
				? {
						teamwork: sum("teamwork") / count,
						communication: sum("communication") / count,
						reliability: sum("reliability") / count,
						behaviour: sum("behaviour") / count,
					}
				: { teamwork: 0, communication: 0, reliability: 0, behaviour: 0 },
		};
	});

// ─────────────────────────────────────────────
// getUniversityCounts
// Public read — total snitch count per university, for the homepage
// cards. Universities with zero snitches still appear, with count 0.
// ─────────────────────────────────────────────

const ALL_UNIVERSITIES = ["BRACU", "NSU", "UIU", "AUST", "EWU", "DIU"] as const;

export const getUniversityCounts = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({
				university: snitch.university,
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(snitch)
			.groupBy(snitch.university);

		const countsByUniversity = Object.fromEntries(
			rows.map((r) => [r.university, r.count]),
		);

		return ALL_UNIVERSITIES.map((tag) => ({
			tag,
			count: countsByUniversity[tag] ?? 0,
		}));
	},
);

// ─────────────────────────────────────────────
// addReview
// A snitch already exists — this adds one more experience to it.
// Enforced: verified email, same university as the snitch, one
// review per user per snitch (DB unique constraint catches this).
//
// Reviews added here are NEVER anonymous. The input type has no
// `anonymous` field and the insert sets it to false explicitly, so a
// tampered request can't smuggle one in.
// ─────────────────────────────────────────────

type AddReviewInput = Ratings & {
	snitchId: string;
	description: string;
};

export const addReview = createServerFn({ method: "POST" })
	.validator((data: AddReviewInput) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			return { ok: false as const, reason: "unauthenticated" as const };
		}
		if (!session.user.emailVerified) {
			return { ok: false as const, reason: "unverified" as const };
		}

		const description = data.description?.trim();
		if (!description) {
			return { ok: false as const, reason: "invalid_input" as const };
		}
		if (!ratingsAreValid(data)) {
			return { ok: false as const, reason: "invalid_rating" as const };
		}

		const [snitchRow] = await db
			.select()
			.from(snitch)
			.where(eq(snitch.id, data.snitchId))
			.limit(1);

		if (!snitchRow) {
			return { ok: false as const, reason: "not_found" as const };
		}
		if (snitchRow.university !== session.user.university) {
			return { ok: false as const, reason: "wrong_university" as const };
		}

		try {
			await db.insert(review).values({
				id: randomUUID(),
				snitchId: data.snitchId,
				authorId: session.user.id,
				teamwork: data.teamwork,
				communication: data.communication,
				reliability: data.reliability,
				behaviour: data.behaviour,
				description,
				anonymous: false,
			});
		} catch (err) {
			if (isUniqueViolation(err)) {
				return { ok: false as const, reason: "already_reviewed" as const };
			}
			throw err;
		}

		return { ok: true as const };
	});

// ─────────────────────────────────────────────
// updateReview
// Lets a user edit a review they already wrote — but only ONCE.
// Only the original author can edit, and once `edited` is true no
// further edits are accepted. Enforced server-side, not just in the UI.
// The `anonymous` flag is never touched here: an edit can't reveal or
// hide an author.
// ─────────────────────────────────────────────

type UpdateReviewInput = Ratings & {
	reviewId: string;
	description: string;
};

export const updateReview = createServerFn({ method: "POST" })
	.validator((data: UpdateReviewInput) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			return { ok: false as const, reason: "unauthenticated" as const };
		}
		if (!session.user.emailVerified) {
			return { ok: false as const, reason: "unverified" as const };
		}

		const description = data.description?.trim();
		if (!description) {
			return { ok: false as const, reason: "invalid_input" as const };
		}
		if (!ratingsAreValid(data)) {
			return { ok: false as const, reason: "invalid_rating" as const };
		}

		const [existing] = await db
			.select({ authorId: review.authorId, edited: review.edited })
			.from(review)
			.where(eq(review.id, data.reviewId))
			.limit(1);

		if (!existing) {
			return { ok: false as const, reason: "not_found" as const };
		}
		if (existing.authorId !== session.user.id) {
			return { ok: false as const, reason: "forbidden" as const };
		}
		if (existing.edited) {
			return { ok: false as const, reason: "already_edited" as const };
		}

		// The `edited = false` condition in the WHERE makes this safe even if
		// two edit requests arrive at the same time: only one can match.
		const updated = await db
			.update(review)
			.set({
				teamwork: data.teamwork,
				communication: data.communication,
				reliability: data.reliability,
				behaviour: data.behaviour,
				description,
				edited: true,
			})
			.where(and(eq(review.id, data.reviewId), eq(review.edited, false)))
			.returning({ id: review.id });

		if (updated.length === 0) {
			return { ok: false as const, reason: "already_edited" as const };
		}

		return { ok: true as const };
	});

// ─────────────────────────────────────────────
// getReviewAuthorEmail
// Returns the email of one review's author, on demand. Only logged-in,
// verified users can call it, so emails are never in the public page
// data. POST (not GET) so authenticated responses are never cached.
//
// Anonymous reviews are refused: their author's email is never revealed.
// ─────────────────────────────────────────────

export const getReviewAuthorEmail = createServerFn({ method: "POST" })
	.validator((data: { reviewId: string }) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			return { ok: false as const, reason: "unauthenticated" as const };
		}
		if (!session.user.emailVerified) {
			return { ok: false as const, reason: "unverified" as const };
		}

		const [row] = await db
			.select({ email: user.email, anonymous: review.anonymous })
			.from(review)
			.innerJoin(user, eq(review.authorId, user.id))
			.where(eq(review.id, data.reviewId))
			.limit(1);

		if (!row) {
			return { ok: false as const, reason: "not_found" as const };
		}
		if (row.anonymous) {
			return { ok: false as const, reason: "anonymous" as const };
		}

		return { ok: true as const, email: row.email };
	});
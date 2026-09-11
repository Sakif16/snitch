import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "#/db/index.ts";
import { review, snitch, user } from "#/db/schema";
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


// createSnitch


type CreateSnitchInput = Ratings & {
	studentName: string;
	studentId: string;
	description: string;
};

export const createSnitch = createServerFn({ method: "POST" })
	.inputValidator((data: CreateSnitchInput) => data)
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

		const studentName = data.studentName?.trim();
		const studentId = data.studentId?.trim();
		const description = data.description?.trim();

		if (!studentName || !studentId || !description) {
			return { ok: false as const, reason: "invalid_input" as const };
		}
		if (!ratingsAreValid(data)) {
			return { ok: false as const, reason: "invalid_rating" as const };
		}

		const snitchId = randomUUID();
		const university = session.user.university;

		try {
			await db.insert(snitch).values({
				id: snitchId,
				studentName,
				studentId,
				university: university as (typeof snitch.$inferInsert)["university"],
				createdById: session.user.id,
			});
		} catch (err) {
			if (isUniqueViolation(err)) {
				const [existing] = await db
					.select({ id: snitch.id })
					.from(snitch)
					.where(
						and(
							eq(
								snitch.university,
								university as (typeof snitch.$inferInsert)["university"],
							),
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

		// NOTE: the Neon HTTP driver doesn't support multi-statement
		// transactions, so this is a separate insert, not wrapped with the
		// one above. In the unlikely event this fails, you'd be left with
		// a snitch that has zero reviews — acceptable for now, revisit if
		// it becomes a real problem.
		await db.insert(review).values({
			id: randomUUID(),
			snitchId,
			authorId: session.user.id,
			teamwork: data.teamwork,
			communication: data.communication,
			reliability: data.reliability,
			behaviour: data.behaviour,
			description,
		});

		return { ok: true as const, snitchId };
	});

// searchSnitches


type SearchSnitchesInput = {
	university: string;
	query: string;
};

export const searchSnitches = createServerFn({ method: "GET" })
	.inputValidator((data: SearchSnitchesInput) => data)
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

// getSnitchDetail


export const getSnitchDetail = createServerFn({ method: "GET" })
	.inputValidator((data: { snitchId: string }) => data)
	.handler(async ({ data }) => {
		const [snitchRow] = await db
			.select()
			.from(snitch)
			.where(eq(snitch.id, data.snitchId))
			.limit(1);

		if (!snitchRow) return null;

		const reviews = await db
			.select({
				id: review.id,
				teamwork: review.teamwork,
				communication: review.communication,
				reliability: review.reliability,
				behaviour: review.behaviour,
				description: review.description,
				createdAt: review.createdAt,
				authorName: user.name,
			})
			.from(review)
			.innerJoin(user, eq(review.authorId, user.id))
			.where(eq(review.snitchId, data.snitchId))
			.orderBy(sql`${review.createdAt} desc`);

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

// addReview


type AddReviewInput = Ratings & {
	snitchId: string;
	description: string;
};

export const addReview = createServerFn({ method: "POST" })
	.inputValidator((data: AddReviewInput) => data)
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
			});
		} catch (err) {
			if (isUniqueViolation(err)) {
				return { ok: false as const, reason: "already_reviewed" as const };
			}
			throw err;
		}

		return { ok: true as const };
	});
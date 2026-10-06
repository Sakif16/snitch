import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { sendSupportEmail } from "./email";

type SupportInput = {
	email: string;
	description: string;
	website?: string; // honeypot — real users never fill this in
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_DESCRIPTION = 2000;

// Simple in-memory rate limit: 3 messages per IP per 10 minutes.
// Resets when the server restarts, which is fine for a single instance.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 3;
const hits = new Map<string, number[]>();

function isRateLimited(key: string) {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
	if (recent.length >= MAX_HITS) {
		hits.set(key, recent);
		return true;
	}
	recent.push(now);
	hits.set(key, recent);
	return false;
}

export const sendSupportMessage = createServerFn({ method: "POST" })
	.validator((data: SupportInput) => data)
	.handler(async ({ data }) => {
		// Bots fill hidden fields. Pretend success and do nothing.
		if (data.website) {
			return { ok: true as const };
		}

		const email = data.email?.trim();
		const description = data.description?.trim();

		if (!email || !EMAIL_RE.test(email) || email.length > 254) {
			return { ok: false as const, reason: "invalid_email" as const };
		}
		if (!description) {
			return { ok: false as const, reason: "invalid_description" as const };
		}
		if (description.length > MAX_DESCRIPTION) {
			return { ok: false as const, reason: "too_long" as const };
		}

		const headers = getRequestHeaders();
		const ip =
			headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
		if (isRateLimited(ip)) {
			return { ok: false as const, reason: "rate_limited" as const };
		}

		const sent = await sendSupportEmail(email, description);
		if (!sent) {
			return { ok: false as const, reason: "send_failed" as const };
		}

		return { ok: true as const };
	});
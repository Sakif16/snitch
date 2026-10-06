import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "../db/index.ts";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { DOMAIN_UNIVERSITY_MAP } from "./universities";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),

	emailAndPassword: {
		enabled: true,
		// Users cannot sign in until their email is verified.
		requireEmailVerification: true,

		// Forgot password: Better Auth creates a single-use token and calls
		// this with the link to email. Fire-and-forget (not awaited) so the
		// response time doesn't reveal whether the email has an account.
		sendResetPassword: async ({ user, url }) => {
			void sendPasswordResetEmail(user.email, url);
		},
		resetPasswordTokenExpiresIn: 3600, // 1 hour
		// After a reset, sign the account out everywhere. If someone else had
		// access to the old password, their sessions die too.
		revokeSessionsOnPasswordReset: true,
	},

	emailVerification: {
		// Fire-and-forget (not awaited) — Better Auth recommends this to
		// avoid timing attacks that could reveal whether an email exists.
		sendVerificationEmail: async ({ user, url }) => {
			void sendVerificationEmail(user.email, url);
		},
		// Send the verification email automatically right after signup.
		sendOnSignUp: true,
		// Once they click the link and verify, log them straight in —
		// no separate login step needed.
		autoSignInAfterVerification: true,
		expiresIn: 3600, // 1 hour
	},

	// Stops someone from using the forgot-password form to flood an inbox.
	// (Better Auth enforces rate limits in production by default.)
	rateLimit: {
		customRules: {
			"/request-password-reset": { window: 60, max: 3 },
			"/forget-password": { window: 60, max: 3 },
		},
	},

	user: {
		additionalFields: {
			university: {
				type: "string",
				required: false,
				input: false,
			},
		},
	},

	databaseHooks: {
		user: {
			create: {
				before: async (userData) => {
					const [localPart, domain] = userData.email.split("@");
					const university = DOMAIN_UNIVERSITY_MAP[domain];

					if (!university) {
						throw new Error(
							"Only university email addresses are allowed. Please use your official university email.",
						);
					}

					// University mailboxes are Google-hosted, so "name+anything@domain"
					// lands in the same inbox as "name@domain". Without this check one
					// person could register many accounts (and, for example, claim many
					// one-time anonymous posts).
					if (localPart.includes("+")) {
						throw new Error(
							'Email addresses containing "+" are not allowed. Please use your plain university email.',
						);
					}

					return {
						data: {
							...userData,
							university,
						},
					};
				},
			},
		},
	},

	plugins: [tanstackStartCookies()],
});
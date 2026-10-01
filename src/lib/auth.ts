import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "../db/index.ts";
import { sendVerificationEmail } from "./email";
import { DOMAIN_UNIVERSITY_MAP } from "./universities";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),

	emailAndPassword: {
		enabled: true,
		// Users cannot sign in until their email is verified.
		requireEmailVerification: true,
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
					const domain = userData.email.split("@")[1];
					const university = DOMAIN_UNIVERSITY_MAP[domain];

					if (!university) {
						throw new Error(
							"Only university email addresses are allowed. Please use your official university email.",
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
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

		requireEmailVerification: true,
	},

	emailVerification: {

		sendVerificationEmail: async ({ user, url }) => {
			void sendVerificationEmail(user.email, url);
		},

		sendOnSignUp: true,

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
					const [localPart, domain] = userData.email.split("@");
					const university = DOMAIN_UNIVERSITY_MAP[domain];

					if (!university) {
						throw new Error(
							"Only university email addresses are allowed. Please use your official university email.",
						);
					}

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
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "../db/index.ts";
import { DOMAIN_UNIVERSITY_MAP } from "./universities";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),

	emailAndPassword: {
		enabled: true,
	},

	user: {
		additionalFields: {
			studentId: {
				type: "string",
				required: true,
				input: true,
			},
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

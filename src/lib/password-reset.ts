import { createServerFn } from "@tanstack/react-start";
import { auth } from "#/lib/auth";

// Checks whether a reset token exists and hasn't expired, WITHOUT using it
// up. The /reset-password route calls this before rendering anything, so the
// page is unreachable without a genuinely valid token.
export const validateResetToken = createServerFn({ method: "POST" })
	.validator((data: { token: string }) => data)
	.handler(async ({ data }) => {
		const token = data.token;
		if (typeof token !== "string" || token.length === 0 || token.length > 256) {
			return { valid: false as const };
		}

		try {
			const ctx = await auth.$context;
			// Same lookup Better Auth itself does when you submit the new password.
			const record = await ctx.internalAdapter.findVerificationValue(
				`reset-password:${token}`,
			);
			const valid = !!record && new Date(record.expiresAt) > new Date();
			return { valid };
		} catch {
			return { valid: false as const };
		}
	});
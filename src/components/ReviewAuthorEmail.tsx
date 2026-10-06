import { useState } from "react";
import { getReviewAuthorEmail } from "#/lib/snitch";

export function ReviewAuthorEmail({ reviewId }: { reviewId: string }) {
	const [email, setEmail] = useState<string | null>(null);
	const [visible, setVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleToggle() {
		setError("");

		if (visible) {
			setVisible(false);
			return;
		}
		// Already fetched once — just reveal it again.
		if (email) {
			setVisible(true);
			return;
		}

		setLoading(true);
		let result: Awaited<ReturnType<typeof getReviewAuthorEmail>>;
		try {
			result = await getReviewAuthorEmail({ data: { reviewId } });
		} catch {
			setLoading(false);
			setError("Something went wrong.");
			return;
		}
		setLoading(false);

		if (!result.ok) {
			const messages: Record<string, string> = {
				unauthenticated: "Log in to see emails.",
				unverified: "Verify your email to see emails.",
				not_found: "This review no longer exists.",
			};
			setError(messages[result.reason] ?? "Something went wrong.");
			return;
		}

		setEmail(result.email);
		setVisible(true);
	}

	return (
		<span className="inline-flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
			{visible && email && <span className="font-mono">{email}</span>}
			<button
				type="button"
				onClick={handleToggle}
				disabled={loading}
				className="underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
			>
				{loading ? "loading..." : visible ? "hide" : "show email"}
			</button>
			{error && <span className="text-red-600">{error}</span>}
		</span>
	);
}
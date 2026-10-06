import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	// ?invalid=true is set when someone is bounced here from a bad reset link.
	validateSearch: (search: Record<string, unknown>): { invalid?: boolean } => ({
		invalid: search.invalid === true || search.invalid === "true" ? true : undefined,
	}),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { invalid } = Route.useSearch();

	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const { error: authError } = await authClient.requestPasswordReset({
			email: email.trim(),
			// Better Auth validates the token, then sends the user here with ?token=...
			redirectTo: "/reset-password",
		});

		setLoading(false);

		if (authError) {
			setError(
				authError.status === 429
					? "Too many requests. Please wait a minute and try again."
					: "Something went wrong. Please try again.",
			);
			return;
		}

		// Same result whether or not the email has an account, on purpose.
		setSent(true);
	}

	if (sent) {
		return (
			<div className="flex min-h-[calc(100vh-93px)] items-center justify-center bg-background px-4 py-6">
				<Card className="w-full max-w-sm">
					<CardHeader className="items-center space-y-3 text-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/10">
							<MailCheck className="h-7 w-7 text-red-600" />
						</div>
						<CardTitle className="text-xl">Check your email</CardTitle>
						<CardDescription className="text-sm">
							If an account exists for
						</CardDescription>
						<p className="break-all font-mono text-sm font-medium text-foreground">
							{email}
						</p>
						<CardDescription className="text-sm">
							we've sent a link to reset the password.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4 text-center">
						<p className="text-xs text-muted-foreground">
							The link works once and expires in 1 hour. It can take a minute,
							and it may land in your{" "}
							<strong className="text-foreground">spam</strong> folder.
						</p>
						<Button variant="custom" asChild>
							<Link to="/signin">Back to sign in</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-[calc(100vh-93px)] items-center justify-center bg-background px-4 py-6">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="font-mono text-xl">
						snitch<span className="text-red-600">.</span>
					</CardTitle>
					<CardDescription>
						enter your email and we'll send you a reset link
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{invalid && (
							<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
								That reset link is invalid or has expired. Request a new one
								below.
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="email">University email</Label>
							<Input
								id="email"
								type="email"
								placeholder="abc@g.bracu.ac.bd"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						{error && <p className="text-sm text-red-600">{error}</p>}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Sending..." : "Send reset link"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							Remembered it?{" "}
							<Link to="/signin" className="text-red-600! hover:underline">
								Sign in
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
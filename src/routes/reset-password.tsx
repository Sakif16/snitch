import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { PasswordInput } from "#/components/PasswordInput";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";
import { validateResetToken } from "#/lib/password-reset";

export const Route = createFileRoute("/reset-password")({
	validateSearch: (
		search: Record<string, unknown>,
	): { token?: string; error?: string } => ({
		token: typeof search.token === "string" ? search.token : undefined,
		error: typeof search.error === "string" ? search.error : undefined,
	}),

	// Runs on the server before anything renders. No valid token = no page.
	beforeLoad: async ({ search }) => {
		if (!search.token || search.error) {
			throw redirect({ to: "/forgot-password", search: { invalid: true } });
		}

		const { valid } = await validateResetToken({ data: { token: search.token } });
		if (!valid) {
			throw redirect({ to: "/forgot-password", search: { invalid: true } });
		}
	},

	// Don't send this URL (it contains the token) to any other site.
	head: () => ({
		meta: [{ name: "referrer", content: "no-referrer" }],
	}),

	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch();

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [linkExpired, setLinkExpired] = useState(false);
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		if (!token) return; // can't happen: beforeLoad guarantees a token

		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setLoading(true);
		const { error: authError } = await authClient.resetPassword({
			newPassword: password,
			token,
		});
		setLoading(false);

		if (authError) {
			if (authError.code === "INVALID_TOKEN") {
				setLinkExpired(true);
				return;
			}
			setError(authError.message ?? "Couldn't reset your password. Please try again.");
			return;
		}

		setPassword("");
		setConfirmPassword("");
		setDone(true);
	}

	if (done) {
		return (
			<div className="flex min-h-[calc(100vh-93px)] items-center justify-center bg-background px-4 py-6">
				<Card className="w-full max-w-sm">
					<CardHeader className="items-center space-y-3 text-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/10">
							<CheckCircle2 className="h-7 w-7 text-red-600" />
						</div>
						<CardTitle className="text-xl">Password updated</CardTitle>
						<CardDescription className="text-sm">
							Your new password is set. You've been signed out of every device,
							so sign in again with the new one.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button variant="custom" asChild>
							<Link to="/signin">Go to sign in</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (linkExpired) {
		return (
			<div className="flex min-h-[calc(100vh-93px)] items-center justify-center bg-background px-4 py-6">
				<Card className="w-full max-w-sm">
					<CardHeader className="space-y-2 text-center">
						<CardTitle className="text-xl">Link expired</CardTitle>
						<CardDescription className="text-sm">
							This reset link was already used or has expired. Request a new
							one.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button variant="custom" asChild>
							<Link to="/forgot-password">Request a new link</Link>
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
					<CardDescription>choose a new password</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="new-password">New password</Label>
							<PasswordInput
								id="new-password"
								autoComplete="new-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirm-new-password">Confirm new password</Label>
							<PasswordInput
								id="confirm-new-password"
								autoComplete="new-password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
						</div>

						{error && <p className="text-sm text-red-600">{error}</p>}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Saving..." : "Set new password"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
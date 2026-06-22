import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { DOMAIN_UNIVERSITY_MAP } from "#/lib/universities";
import { Button } from "@/components/ui/button";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();

	const [name, setName] = useState("");
	const [studentId, setStudentId] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const domain = email.split("@")[1] ?? "";
	const detectedUniversity = DOMAIN_UNIVERSITY_MAP[domain] ?? null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		// ── Client-side guards ──
		if (!detectedUniversity) {
			setError("Please use your official university email address.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}

		setLoading(true);

		const { error: authError } = await authClient.signUp.email({
			name,
			email,
			password,
			studentId,
		});

		setLoading(false);

		if (authError) {
			setError(authError.message ?? "Something went wrong. Please try again.");
			return;
		}
		navigate({ to: "/" });
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="font-mono text-xl">
						snitch<span className="text-red-600">.</span>
					</CardTitle>
					<CardDescription>university email required</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Full name</Label>
							<Input
								id="name"
								type="text"
								placeholder="as on your student ID"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="studentId">Student ID</Label>
							<Input
								id="studentId"
								type="text"
								placeholder="e.g. 22101234"
								value={studentId}
								onChange={(e) => setStudentId(e.target.value)}
								required
							/>
						</div>

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
							{/* Live university detection banner */}
							{detectedUniversity && (
								<div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
									<span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
									detected: {detectedUniversity}
								</div>
							)}
							{/* Warn if they've typed past the @ with no valid domain */}
							{!detectedUniversity && domain && (
								<div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
									<span className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" />
									not a recognised university domain
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm password</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
						</div>

						{/* Server or validation error */}
						{error && <p className="text-sm text-red-600">{error}</p>}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Creating account..." : "Create account"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							Already have an account?{" "}
							<a href="/login" className="text-red-600 hover:underline">
								Log in
							</a>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

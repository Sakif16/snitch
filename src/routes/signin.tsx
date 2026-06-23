import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
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

export const Route = createFileRoute("/signin")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const { error: authError } = await authClient.signIn.email({
			email,
			password,
		});

		setLoading(false);

		if (authError) {
			if (authError.status === 403) {
				setError("Please verify your email address before signing in.");
			} else {
				setError(authError.message ?? "Invalid email or password.");
			}
			return;
		}

		navigate({ to: "/" });
	}

	return (
		<div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-background px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="font-mono text-xl">
						snitch<span className="text-red-600">.</span>
					</CardTitle>
					<CardDescription>sign in to your account</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
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

						{error && <p className="text-sm text-red-600">{error}</p>}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Signing in..." : "Sign in"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							Don't have an account?{" "}
							<Link to="/signup" className="text-red-600 hover:underline">
								Sign up
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
	const [fullName, setFullName] = useState("");
	const [studentId, setStudentId] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	function handleSubmit(e: any) {
		e.preventDefault();
		// TODO: wire up Better Auth signup call here
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
							<Label htmlFor="fullName">Full name</Label>
							<Input
								id="fullName"
								type="text"
								placeholder="as on your student ID"
								value={fullName}
								onChange={(e: any) => setFullName(e.target.value)}
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
								onChange={(e: any) => setStudentId(e.target.value)}
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
								onChange={(e: any) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e: any) => setPassword(e.target.value)}
								required
							/>
						</div>

						<Button type="submit" className="w-full">
							Create account
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Textarea } from "#/components/ui/textarea";
import { sendSupportMessage } from "#/lib/support";

export const Route = createFileRoute("/support")({
	component: SupportPage,
});

const MAX_DESCRIPTION = 2000;

function SupportPage() {
	const [email, setEmail] = useState("");
	const [description, setDescription] = useState("");
	const [website, setWebsite] = useState(""); // honeypot
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);

	function handleClear() {
		setEmail("");
		setDescription("");
		setError("");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		if (!email.trim() || !description.trim()) {
			setError("Please fill in your email and a description.");
			return;
		}

		setLoading(true);
		let result: Awaited<ReturnType<typeof sendSupportMessage>>;
		try {
			result = await sendSupportMessage({
				data: { email: email.trim(), description: description.trim(), website },
			});
		} catch {
			setLoading(false);
			setError("Something went wrong. Please try again.");
			return;
		}
		setLoading(false);

		if (!result.ok) {
			const messages: Record<string, string> = {
				invalid_email: "Please enter a valid email address.",
				invalid_description: "Please describe your issue.",
				too_long: `Your message is too long (max ${MAX_DESCRIPTION} characters).`,
				rate_limited: "Too many messages. Please try again in a few minutes.",
				send_failed: "We couldn't send your message. Please try again later.",
			};
			setError(messages[result.reason] ?? "Something went wrong.");
			return;
		}

		setSent(true);
		handleClear();
	}

	return (
		<div className="flex min-h-[calc(100vh-93px)] items-center justify-center bg-background px-4 py-10">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="font-mono text-xl">
						contact support<span className="text-red-600">.</span>
					</CardTitle>
					<CardDescription>
						Tell us what's wrong and support team will contact you through the provided email.
					</CardDescription>
				</CardHeader>

				<CardContent>
					{sent ? (
						<div className="space-y-4 text-center">
							<p className="text-sm text-foreground">
								Message sent. We'll reply to your email as soon as we can.
							</p>
							<div className="flex justify-center gap-2">
								<Button variant="outline" onClick={() => setSent(false)}>
									Send another
								</Button>
								<Button variant="custom" asChild>
									<Link to="/">Back home</Link>
								</Button>
							</div>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="support-email">Your email</Label>
								<Input
									id="support-email"
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="support-description">Description</Label>
								<Textarea
									id="support-description"
									placeholder="Describe your issue or request..."
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									maxLength={MAX_DESCRIPTION}
									className="min-h-32"
									required
								/>
								<p className="text-right text-xs text-muted-foreground">
									{description.length}/{MAX_DESCRIPTION}
								</p>
							</div>

							{/* Honeypot: hidden from people, bots tend to fill it in. */}
							<input
								type="text"
								name="website"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
								tabIndex={-1}
								autoComplete="off"
								aria-hidden="true"
								className="hidden"
							/>

							{error && <p className="text-sm text-red-600">{error}</p>}

							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={handleClear}
									disabled={loading}
								>
									Clear
								</Button>
								<Button
									type="submit"
									variant="custom"
									className="flex-1"
									disabled={loading}
								>
									{loading ? "Sending..." : "Send"}
								</Button>
							</div>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
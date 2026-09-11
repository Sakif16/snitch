import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { addReview } from "#/lib/snitch";

type Ratings = {
	teamwork: number;
	communication: number;
	reliability: number;
	behaviour: number;
};

const RATING_FIELDS: { key: keyof Ratings; label: string }[] = [
	{ key: "teamwork", label: "Teamwork" },
	{ key: "communication", label: "Communication" },
	{ key: "reliability", label: "Reliability" },
	{ key: "behaviour", label: "Behaviour" },
];

function StarPicker({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="flex gap-1">
			{[1, 2, 3, 4, 5].map((n) => (
				<button
					key={n}
					type="button"
					onClick={() => onChange(n)}
					className={`text-lg leading-none transition-colors ${
						n <= value ? "text-red-600" : "text-border"
					}`}
				>
					★
				</button>
			))}
		</div>
	);
}

export function AddReviewModal({ snitchId }: { snitchId: string }) {
	const router = useRouter();

	const [open, setOpen] = useState(false);
	const [ratings, setRatings] = useState<Ratings>({
		teamwork: 0,
		communication: 0,
		reliability: 0,
		behaviour: 0,
	});
	const [description, setDescription] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function resetForm() {
		setRatings({ teamwork: 0, communication: 0, reliability: 0, behaviour: 0 });
		setDescription("");
		setError("");
	}

	async function handleSubmit() {
		setError("");

		const allRated = Object.values(ratings).every((v) => v >= 1);
		if (!allRated) {
			setError("Please rate all four categories.");
			return;
		}
		if (!description.trim()) {
			setError("Please describe your experience.");
			return;
		}

		setLoading(true);
		const result = await addReview({
			data: { snitchId, ...ratings, description: description.trim() },
		});
		setLoading(false);

		if (!result.ok) {
			const messages: Record<string, string> = {
				unauthenticated: "Please log in to post a review.",
				unverified: "Please verify your email before posting.",
				not_found: "This snitch no longer exists.",
				wrong_university:
					"You can only review students at your own university.",
				already_reviewed: "You've already reviewed this student.",
				invalid_input: "Please fill in all fields.",
				invalid_rating: "Ratings must be between 1 and 5.",
			};
			setError(messages[result.reason] ?? "Something went wrong.");
			return;
		}

		setOpen(false);
		resetForm();
		router.invalidate(); // re-runs the loader so the new review shows up
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) resetForm();
			}}
		>
			<DialogTrigger asChild>
				<Button variant="custom">+ add experience</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add your experience</DialogTitle>
					<DialogDescription>
						Rate this groupmate honestly. Your name will be visible on this
						review.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-4 py-2">
					{RATING_FIELDS.map((f) => (
						<div key={f.key} className="space-y-1">
							<p className="text-xs text-muted-foreground">{f.label}</p>
							<StarPicker
								value={ratings[f.key]}
								onChange={(v) =>
									setRatings((prev) => ({ ...prev, [f.key]: v }))
								}
							/>
						</div>
					))}
				</div>

				<Textarea
					placeholder="Describe what happened during the project..."
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="min-h-24"
				/>

				{error && <p className="text-sm text-red-600">{error}</p>}

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button variant="custom" onClick={handleSubmit} disabled={loading}>
						{loading ? "Posting..." : "Post experience"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
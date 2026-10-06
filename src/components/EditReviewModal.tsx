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
import { updateReview } from "#/lib/snitch";

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

export function EditReviewModal({
	reviewId,
	initialRatings,
	initialDescription,
	anonymous = false,
}: {
	reviewId: string;
	initialRatings: Ratings;
	initialDescription: string;
	anonymous?: boolean;
}) {
	const router = useRouter();

	const [open, setOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [ratings, setRatings] = useState<Ratings>(initialRatings);
	const [description, setDescription] = useState(initialDescription);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	function resetToInitial() {
		setRatings(initialRatings);
		setDescription(initialDescription);
		setError("");
		setConfirmOpen(false);
	}

	// Step 1: validate the form, then ask for confirmation.
	function handleSaveClick() {
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

		setConfirmOpen(true);
	}

	// Step 2: the user confirmed — actually save.
	async function handleConfirmedSubmit() {
		setLoading(true);
		const result = await updateReview({
			data: { reviewId, ...ratings, description: description.trim() },
		});
		setLoading(false);
		setConfirmOpen(false);

		if (!result.ok) {
			const messages: Record<string, string> = {
				unauthenticated: "Please log in to edit this review.",
				unverified: "Please verify your email before editing.",
				not_found: "This review no longer exists.",
				forbidden: "You can only edit your own review.",
				already_edited: "You have already edited this review once.",
				invalid_input: "Please fill in all fields.",
				invalid_rating: "Ratings must be between 1 and 5.",
			};
			setError(messages[result.reason] ?? "Something went wrong.");
			return;
		}

		setOpen(false);
		router.invalidate(); // re-runs the loader so the edit shows up
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) resetToInitial();
			}}
		>
			<DialogTrigger asChild>
				<button type="button" className="text-xs text-red-600 hover:underline">
					edit your review
				</button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit your review</DialogTitle>
					<DialogDescription>
						Update your ratings or description.{" "}
						{anonymous
							? "Your review stays anonymous."
							: "Your name stays visible as the author."}{" "}
						You can edit your review only once.
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
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="min-h-24"
				/>

				{error && <p className="text-sm text-red-600">{error}</p>}

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button variant="custom" onClick={handleSaveClick} disabled={loading}>
						Save changes
					</Button>
				</DialogFooter>

				{/* Confirmation modal */}
				<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
					<DialogContent showCloseButton={false}>
						<DialogHeader>
							<DialogTitle>Edit only once</DialogTitle>
							<DialogDescription>
								You can edit your review only once. After you save, you won't
								be able to change it again. Do you want to continue?
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setConfirmOpen(false)}
								disabled={loading}
							>
								Go back
							</Button>
							<Button
								variant="custom"
								onClick={handleConfirmedSubmit}
								disabled={loading}
							>
								{loading ? "Saving..." : "Yes, save my edit"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DialogContent>
		</Dialog>
	);
}
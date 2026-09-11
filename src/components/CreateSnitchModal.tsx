import { Link, useNavigate } from "@tanstack/react-router";
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
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { createSnitch } from "#/lib/snitch";

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

export function CreateSnitchModal() {
	const navigate = useNavigate();

	const [open, setOpen] = useState(false);
	const [studentName, setStudentName] = useState("");
	const [studentId, setStudentId] = useState("");
	const [ratings, setRatings] = useState<Ratings>({
		teamwork: 0,
		communication: 0,
		reliability: 0,
		behaviour: 0,
	});
	const [description, setDescription] = useState("");
	const [error, setError] = useState("");
	// existingSnitchId is set when the server tells us this student already
	// has a snitch — we show a link to it instead of a plain error.
	const [existingSnitchId, setExistingSnitchId] = useState<string | null>(
		null,
	);
	const [loading, setLoading] = useState(false);

	function resetForm() {
		setStudentName("");
		setStudentId("");
		setRatings({ teamwork: 0, communication: 0, reliability: 0, behaviour: 0 });
		setDescription("");
		setError("");
		setExistingSnitchId(null);
	}

	async function handleSubmit() {
		setError("");
		setExistingSnitchId(null);

		if (!studentName.trim() || !studentId.trim()) {
			setError("Please enter the student's name and ID.");
			return;
		}
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
		const result = await createSnitch({
			data: {
				studentName: studentName.trim(),
				studentId: studentId.trim(),
				...ratings,
				description: description.trim(),
			},
		});
		setLoading(false);

		if (!result.ok) {
			if (result.reason === "already_exists") {
				setExistingSnitchId(result.existingSnitchId ?? null);
				setError("A snitch already exists for this student ID.");
				return;
			}

			const messages: Record<string, string> = {
				unauthenticated: "Please log in to post a snitch.",
				unverified: "Please verify your email before posting.",
				no_university: "Your account has no university on record.",
				invalid_input: "Please fill in all fields.",
				invalid_rating: "Ratings must be between 1 and 5.",
			};
			setError(messages[result.reason] ?? "Something went wrong.");
			return;
		}

		setOpen(false);
		resetForm();
		navigate({ to: "/snitch/$id", params: { id: result.snitchId } });
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
				<Button variant="custom">Add Snitch</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Post a snitch</DialogTitle>
					<DialogDescription>
						Identify the student and share your experience. Your name will
						be visible on this review.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Student name</p>
						<Input
							placeholder="e.g. Rafiul Hasan"
							value={studentName}
							onChange={(e) => setStudentName(e.target.value)}
						/>
					</div>

					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Student ID</p>
						<Input
							placeholder="e.g. 22101234"
							value={studentId}
							onChange={(e) => setStudentId(e.target.value)}
						/>
					</div>
				</div>

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

				{error && (
					<div className="text-sm text-red-600">
						{error}
						{existingSnitchId && (
							<>
								{" "}
								<Link
									to="/snitch/$id"
									params={{ id: existingSnitchId }}
									className="underline"
									onClick={() => setOpen(false)}
								>
									View existing snitch →
								</Link>
							</>
						)}
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button variant="custom" onClick={handleSubmit} disabled={loading}>
						{loading ? "Posting..." : "Post snitch"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
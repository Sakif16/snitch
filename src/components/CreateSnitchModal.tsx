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
import { ANONYMOUS_LIMIT_MESSAGE } from "#/lib/anonymous";
import { createSnitch, getAnonymousStatus } from "#/lib/snitch";

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

export function CreateSnitchModal({
	enabled,
	disabledReason,
}: {
	enabled: boolean;
	disabledReason?: string;
}) {
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

	// Anonymous toggle
	const [anonymous, setAnonymous] = useState(false);
	const [anonError, setAnonError] = useState("");
	const [checkingAnon, setCheckingAnon] = useState(false);

	function resetForm() {
		setStudentName("");
		setStudentId("");
		setRatings({ teamwork: 0, communication: 0, reliability: 0, behaviour: 0 });
		setDescription("");
		setError("");
		setExistingSnitchId(null);
		setAnonymous(false);
		setAnonError("");
		setCheckingAnon(false);
	}

	// Turning the toggle ON asks the server first. If the user's one-time
	// anonymous post is already used, the toggle stays off and the exact
	// error message is shown. (The server re-checks on submit regardless.)
	async function handleToggleAnonymous() {
		setAnonError("");

		if (anonymous) {
			setAnonymous(false);
			return;
		}

		setCheckingAnon(true);
		let status: Awaited<ReturnType<typeof getAnonymousStatus>>;
		try {
			status = await getAnonymousStatus();
		} catch {
			setCheckingAnon(false);
			setAnonError("Something went wrong. Please try again.");
			return;
		}
		setCheckingAnon(false);

		if (!status.ok) {
			setAnonError(
				status.reason === "unauthenticated"
					? "Please log in to post a snitch."
					: "Please verify your email before posting.",
			);
			return;
		}
		if (!status.available) {
			setAnonError(ANONYMOUS_LIMIT_MESSAGE);
			return;
		}

		setAnonymous(true);
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
				anonymous,
			},
		});
		setLoading(false);

		if (!result.ok) {
			if (result.reason === "already_exists") {
				setExistingSnitchId(result.existingSnitchId ?? null);
				setError("A snitch already exists for this student ID.");
				return;
			}

			if (result.reason === "anonymous_already_used") {
				// Server says the one-time slot is gone: switch the toggle off
				// and show the exact message.
				setAnonymous(false);
				setAnonError(ANONYMOUS_LIMIT_MESSAGE);
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

	if (!enabled) {
		return (
			<div className="flex flex-col items-center gap-1">
				<Button variant="custom" disabled>
					Add Snitch
				</Button>
				{disabledReason && (
					<p className="text-xs text-muted-foreground">{disabledReason}</p>
				)}
			</div>
		);
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
						Identify the student and share your experience.{" "}
						{anonymous
							? "Your name and email will be hidden on this review."
							: "Your name will be visible on this review."}
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

				{/* Anonymous toggle */}
				<div className="space-y-1.5 rounded-md border border-border p-3">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium text-foreground">
								Post anonymously
							</p>
							<p className="text-xs text-muted-foreground">
								Hides your name and email from other users. You can do this
								only once, ever.
							</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={anonymous}
							aria-label="Post anonymously"
							onClick={handleToggleAnonymous}
							disabled={checkingAnon || loading}
							className={`relative h-5 w-9 shrink-0 rounded-full border border-border transition-colors disabled:opacity-50 ${
								anonymous ? "bg-red-600" : "bg-muted"
							}`}
						>
							<span
								className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
									anonymous ? "translate-x-4" : ""
								}`}
							/>
						</button>
					</div>
					{anonError && <p className="text-sm text-red-600">{anonError}</p>}
				</div>

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
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AddReviewModal } from "#/components/AddReviewModal";
import { EditReviewModal } from "#/components/EditReviewModal";
import { ReviewAuthorEmail } from "#/components/ReviewAuthorEmail";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { authClient } from "#/lib/auth-client";
import { getSnitchDetail } from "#/lib/snitch";

export const Route = createFileRoute("/snitch/$id")({
	loader: async ({ params }) => {
		const data = await getSnitchDetail({ data: { snitchId: params.id } });
		if (!data) throw notFound();
		return data;
	},
	component: SnitchDetailPage,
});

function RatingCell({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col items-center gap-1 px-2 py-3">
			<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<p className="text-lg font-medium text-foreground">
				{value.toFixed(1)}
			</p>
		</div>
	);
}

// Shows "Sep 30, 2026, 2:14 PM" — date and exact local time together,
// using the viewer's own browser locale and timezone automatically.
function formatDateTime(value: string | Date) {
	return new Date(value).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function SnitchDetailPage() {
	const { snitch, reviews, averages } = Route.useLoaderData();
	const { data: session } = authClient.useSession();

	// `isMine` is computed on the server (the client never receives author
	// ids). Requiring a live session here also hides the edit/add controls
	// immediately if the user signs out while the page is open.
	const myReview = session ? reviews.find((r) => r.isMine) : undefined;

	return (
		<div className="mx-auto max-w-2xl px-5 py-10">
			{/* Back link */}
			<Link
				to="/university/$tag"
				params={{ tag: snitch.university }}
				className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
			>
				← back to {snitch.university}
			</Link>

			{/* Profile card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-xl">{snitch.studentName}</CardTitle>
						<CardDescription className="font-mono">
							ID: {snitch.studentId} · {snitch.university}
						</CardDescription>
					</div>
					{/* If the user already has a review here, don't offer to add a
					    second one — they edit their existing one instead (below). */}
					{!myReview && <AddReviewModal snitchId={snitch.id} />}
				</CardHeader>

				<CardContent>
					<div className="grid grid-cols-4 divide-x divide-border rounded-md border border-border">
						<RatingCell label="Teamwork" value={averages.teamwork} />
						<RatingCell label="Comms" value={averages.communication} />
						<RatingCell label="Reliability" value={averages.reliability} />
						<RatingCell label="Behaviour" value={averages.behaviour} />
					</div>
					<p className="mt-2 text-center text-xs text-muted-foreground">
						averaged across {reviews.length} review
						{reviews.length === 1 ? "" : "s"}
					</p>
				</CardContent>
			</Card>

			{/* Reviews */}
			<div className="mt-8 space-y-3">
				<p className="text-sm font-medium text-foreground">
					{reviews.length} experience{reviews.length === 1 ? "" : "s"} shared
				</p>

				{reviews.length === 0 && (
					<p className="text-sm text-muted-foreground">
						No reviews yet. Be the first to share an experience.
					</p>
				)}

				{reviews.map((r) => {
					const isMine = !!session && r.isMine;
					// Edit button is only shown while the single allowed edit is unused.
					const canEdit = isMine && !r.edited;

					return (
						<Card key={r.id}>
							<CardHeader className="flex flex-row items-start justify-between">
								<div>
									<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
										<CardTitle className="text-sm font-medium">
											{r.anonymous ? "Anonymous" : r.authorName}
											{r.anonymous && isMine && (
												<span className="ml-1 font-normal text-muted-foreground">
													(you)
												</span>
											)}
										</CardTitle>
										{/* Anonymous authors' emails are never available. */}
										{!r.anonymous && <ReviewAuthorEmail reviewId={r.id} />}
									</div>
									<CardDescription className="mt-1">
										{formatDateTime(r.createdAt)}
										{r.edited && (
											<span className="ml-1 italic">
												(edited {formatDateTime(r.updatedAt)})
											</span>
										)}
									</CardDescription>
								</div>
								{canEdit && (
									<EditReviewModal
										reviewId={r.id}
										anonymous={r.anonymous}
										initialRatings={{
											teamwork: r.teamwork,
											communication: r.communication,
											reliability: r.reliability,
											behaviour: r.behaviour,
										}}
										initialDescription={r.description}
									/>
								)}
							</CardHeader>
							<CardContent>
								<div className="mb-2 flex gap-4 text-xs text-muted-foreground">
									<span>
										Teamwork{" "}
										<strong className="text-foreground">{r.teamwork}</strong>
									</span>
									<span>
										Comms{" "}
										<strong className="text-foreground">
											{r.communication}
										</strong>
									</span>
									<span>
										Reliability{" "}
										<strong className="text-foreground">
											{r.reliability}
										</strong>
									</span>
									<span>
										Behaviour{" "}
										<strong className="text-foreground">{r.behaviour}</strong>
									</span>
								</div>
								<p className="text-sm text-muted-foreground">
									{r.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
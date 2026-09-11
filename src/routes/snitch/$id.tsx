import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
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

function SnitchDetailPage() {
	const { snitch, reviews, averages } = Route.useLoaderData();

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
					<Button variant="custom">+ add experience</Button>
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

				{reviews.map((r) => (
					<Card key={r.id}>
						<CardHeader>
							<CardTitle className="text-sm font-medium">
								{r.authorName}
							</CardTitle>
							<CardDescription>
								{new Date(r.createdAt).toLocaleDateString()}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="mb-2 flex gap-4 text-xs text-muted-foreground">
								<span>Teamwork <strong className="text-foreground">{r.teamwork}</strong></span>
								<span>Comms <strong className="text-foreground">{r.communication}</strong></span>
								<span>Reliability <strong className="text-foreground">{r.reliability}</strong></span>
								<span>Behaviour <strong className="text-foreground">{r.behaviour}</strong></span>
							</div>
							<p className="text-sm text-muted-foreground">{r.description}</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
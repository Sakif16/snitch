import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreateSnitchModal } from "#/components/CreateSnitchModal";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { searchSnitches } from "#/lib/snitch";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/university/$tag")({
	component: RouteComponent,
});

function RouteComponent() {
	const { tag } = Route.useParams();

	const [query, setQuery] = useState("");
	const [results, setResults] = useState<
		Awaited<ReturnType<typeof searchSnitches>>
	>([]);
	const [loading, setLoading] = useState(false);

	// Re-run the search whenever the query changes.
	// No debounce yet — fine for now, worth adding later if it feels laggy.
	useEffect(() => {
		const trimmed = query.trim();
		if (!trimmed) {
			setResults([]);
			return;
		}

		let cancelled = false;
		setLoading(true);

		searchSnitches({ data: { university: tag.toUpperCase(), query: trimmed } })
			.then((rows) => {
				if (!cancelled) setResults(rows);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [query, tag]);

	return (
		<>
			<div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 py-5">
				<div className="text-center">
					<h1 className="text-xl font-medium text-foreground">
						Search snitches in{" "}
						<span className="font-bold text-red-600">{tag.toUpperCase()}</span>
					</h1>
				</div>
				<Input
					placeholder="Search by student ID or name..."
					className="w-full max-w-sm"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>

			<div className="flex items-center justify-center">
				<CreateSnitchModal />
			</div>

			<div className="flex flex-col items-center justify-center gap-3 py-10">
				<p className="text-sm text-muted-foreground">
					{loading
						? "Searching..."
						: query.trim()
							? `${results.length} result${results.length === 1 ? "" : "s"}`
							: "Type a name or student ID to search"}
				</p>

				{results.map((s) => (
					<Link
						key={s.id}
						to="/snitch/$id"
						params={{ id: s.id }}
						className="w-full max-w-sm"
					>
						<Card className="w-full transition-colors hover:border-red-500">
							<CardHeader>
								<CardTitle>{s.studentName}</CardTitle>
								<CardDescription>
									ID: {s.studentId} · {s.reviewCount} review
									{s.reviewCount === 1 ? "" : "s"}
								</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}

				{!loading && query.trim() && results.length === 0 && (
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle>No snitch found</CardTitle>
							<CardDescription>
								Nothing matches "{query.trim()}" yet. Be the first to post.
							</CardDescription>
						</CardHeader>
					</Card>
				)}
			</div>
		</>
	);
}
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

const UNIVERSITIES = [
	{
		tag: "BRACU",
		name: "BRAC University",
		count: 142,
	},
	{
		tag: "NSU",
		name: "North South University",
		count: 98,
	},
	{
		tag: "UIU",
		name: "United International University",
		count: 61,
	},
	{
		tag: "EWU",
		name: "East West University",
		count: 47,
	},
	{
		tag: "AUST",
		name: "Ahsanullah University of Science & Technology",
		count: 33,
	},
	{
		tag: "DIU",
		name: "Daffodil International University",
		count: 29,
	},
] as const;

function HomePage() {
	return (
		<div className="mx-auto max-w-5xl px-5 py-12">
			{/* Hero */}
			<div className="mb-12 text-center">
				<p className="mb-2 font-mono text-xs uppercase tracking-widest text-red-600">
					transparency, always
				</p>
				<h1 className="mb-3 text-4xl font-medium tracking-tight text-foreground">
					Know who you're working with.
				</h1>
				<p className="text-sm text-muted-foreground">
					Pick your university. Find a groupmate. Post an experience.
				</p>
			</div>

			{/* University cards */}
			<p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
				browse by university
			</p>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
				{UNIVERSITIES.map((uni) => (
					<Link
						key={uni.tag}
						to="/university/$tag"
						params={{ tag: uni.tag }}
						className="group relative overflow-hidden rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-red-500"
					>
						{/* Red accent stripe on hover */}
						<span className="absolute right-0 top-0 h-full w-[3px] bg-red-600 opacity-0 transition-opacity group-hover:opacity-100" />

						<p className="mb-1 font-mono text-xs uppercase tracking-wide text-red-600">
							{uni.tag}
						</p>
						<p className="text-sm font-medium text-card-foreground">
							{uni.name}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{uni.count} snitches
						</p>
					</Link>
				))}
			</div>
		</div>
	);
}
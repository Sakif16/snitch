import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

// Change this if your repo lives somewhere else.
const REPO_URL = "https://github.com/sakif16/snitch";

export function Footer() {
	return (
		<footer className="fixed inset-x-0 bottom-0 z-40 h-9 border-t border-border bg-background">
			<div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5 text-[11px] text-muted-foreground">
				<p>© {new Date().getFullYear()} Sakib Muhtasim</p>

				<div className="flex items-center gap-4">
					<a
						href={REPO_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-muted-foreground! no-underline hover:text-foreground!"
					>
						<Star className="h-3 w-3" />
						<span className="hidden sm:inline">Star on GitHub</span>
						<span className="sm:hidden">Star</span>
					</a>

					<Link
						to="/support"
						className="text-muted-foreground! no-underline hover:text-foreground!"
					>
						Contact support
					</Link>
				</div>
			</div>
		</footer>
	);
}
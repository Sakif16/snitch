import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="border-t border-border bg-background">
			<div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-5 py-4 text-xs text-muted-foreground sm:flex-row">
				<p>© {new Date().getFullYear()} Sakib Muhtasim. All rights reserved.</p>
				<Link
					to="/support"
					className="text-muted-foreground! no-underline hover:text-foreground!"
				>
					Contact support
				</Link>
			</div>
		</footer>
	);
}
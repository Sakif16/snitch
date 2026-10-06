import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="fixed inset-x-0 bottom-0 z-40 h-9 border-t border-border bg-background">
			<div className="mx-auto flex h-full max-w-5xl items-center justify-between px-5 text-[11px] text-muted-foreground">
				<p>© {new Date().getFullYear()} Sakib Muhtasim</p>
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
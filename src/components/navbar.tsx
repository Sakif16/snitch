import { Link } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";

export function Navbar() {
	const { data: session, isPending } = authClient.useSession();

	return (
		<nav className="sticky top-0 z-50 border-b border-border bg-background">
			<div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
				{/* Logo */}
				<Link to="/" className="font-mono text-lg font-medium tracking-tight">
					snitch<span className="text-red-800">.</span>
				</Link>

				{/* Right side */}
				<div className="flex items-center gap-2">
					{isPending ? (
						<div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
					) : session ? (
						<>
							<span className="text-sm text-muted-foreground">
								{session.user.name}
							</span>
							<button
								onClick={() => authClient.signOut()}
								className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
							>
								sign out
							</button>
						</>
					) : (
						<>
							<Link
								to="/signin"
								className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
							>
								Sign in
							</Link>
							<Link
								to="/signup"
								className="rounded-full bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
							>
								sign up
							</Link>
						</>
					)}
				</div>
			</div>
		</nav>
	);
}
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
	// The <html> class is the single source of truth. The inline script in
	// __root.tsx sets it before first paint, so there is no state to sync.
	function toggle() {
		const root = document.documentElement;
		const next = !root.classList.contains("dark");
		root.classList.toggle("dark", next);
		try {
			localStorage.setItem("theme", next ? "dark" : "light");
		} catch {
			// storage unavailable — theme still switches for this session
		}
	}

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label="Toggle theme"
			className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
		>
			{/* CSS picks the right icon, so it is correct from the first paint */}
			<Sun className="hidden h-4 w-4 dark:block" />
			<Moon className="block h-4 w-4 dark:hidden" />
		</button>
	);
}
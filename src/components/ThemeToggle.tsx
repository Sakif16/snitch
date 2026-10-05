import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const [isDark, setIsDark] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Sync with whatever theme is actually applied once we're in the browser.
	useEffect(() => {
		let stored: string | null = null;
		try {
			stored = localStorage.getItem("theme");
		} catch {
			// storage unavailable (e.g. private mode) — fall back to system
		}
		const dark = stored
			? stored === "dark"
			: window.matchMedia("(prefers-color-scheme: dark)").matches;

		document.documentElement.classList.toggle("dark", dark);
		setIsDark(dark);
		setMounted(true);
	}, []);

	function toggle() {
		const next = !isDark;
		setIsDark(next);
		document.documentElement.classList.toggle("dark", next);
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
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
		>
			{/* Render nothing until mounted so the icon never flashes the wrong way */}
			{mounted ? (
				isDark ? (
					<Sun className="h-4 w-4" />
				) : (
					<Moon className="h-4 w-4" />
				)
			) : (
				<span className="h-4 w-4" />
			)}
		</button>
	);
}
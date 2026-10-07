import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

export const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

export function Analytics() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	useEffect(() => {
		if (!GA_ID || typeof window.gtag !== "function") return;
		// Only the path is sent, never the query string, because
		// /reset-password?token=... contains a secret token.
		window.gtag("event", "page_view", {
			page_path: pathname,
			page_location: `${window.location.origin}${pathname}`,
			page_title: document.title,
		});
	}, [pathname]);

	return null;
}
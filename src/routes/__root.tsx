import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Footer } from '#/components/Footer'
import { Navbar } from '#/components/navbar'
import appCss from '../styles.css?url'

// Runs in <head> before first paint so the correct theme class is on <html>
// before anything is rendered. Same logic as ThemeToggle.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`

// Cloudflare Web Analytics. Cookie-less, and it tracks client-side route
// changes by itself, so no manual page-view code is needed. Off if the
// token isn't set.
const CF_TOKEN = import.meta.env.VITE_CF_BEACON_TOKEN as string | undefined

const analyticsScripts = CF_TOKEN
  ? [
      {
        children: `
(function () {
  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", ${JSON.stringify(JSON.stringify({ token: CF_TOKEN }))});
  document.head.appendChild(s);
})();
`,
      },
    ]
  : []

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Snitch.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
    scripts: analyticsScripts,
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap, must run before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        <Navbar />
        {/* pb-9 = footer height (h-9), so content never hides behind it */}
        <main className="pb-9">{children}</main>
        <Footer />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
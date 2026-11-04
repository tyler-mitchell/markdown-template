import { HeadContent, Scripts, createRootRouteWithContext, Link } from "@tanstack/react-router";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Markdown Template",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="flex h-dvh min-h-0 flex-col">
          <nav aria-label="Examples" className="flex items-center gap-6 border-b px-6 py-3 text-sm">
            <span className="font-semibold">Markdown Template</span>
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "underline underline-offset-4" }}
            >
              Editor
            </Link>
            <Link to="/server" activeProps={{ className: "underline underline-offset-4" }}>
              Server rendering
            </Link>
          </nav>
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  );
}

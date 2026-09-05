import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0b1620" },
      { name: "application-name", content: "TALKSWAHILI" },
      { name: "author", content: "TALKSWAHILI" },
      { title: "TALKSWAHILI — Chati na Wageni, Lipwa Papo Hapo" },
      {
        name: "description",
        content:
          "TALKSWAHILI ni jukwaa la chat na wageni kwa Kiswahili, voice call na video call, pamoja na dashibodi ya kufuatilia matumizi na balance.",
      },
      {
        name: "keywords",
        content:
          "TALKSWAHILI, Talkswahili, Talk Swahili, TALKSWAHILI Live, talkswahililive.site, Kiswahili ni Fursa, chat na wageni, kuchat na wazungu, kazi online Tanzania, kipato online Tanzania, chat Tanzania, voice call, video call, USSD Push, Mobilipa",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "TALKSWAHILI — Chati na Wageni, Lipwa Papo Hapo" },
      {
        property: "og:description",
        content: "Chati na wageni waliopo mtandaoni, fuatilia mapato yako na toa pesa haraka.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://talkswahililive.site/favicon.png" },
      { property: "og:url", content: "https://talkswahililive.site/" },
      { property: "og:site_name", content: "TALKSWAHILI" },
      { property: "og:locale", content: "sw_TZ" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TALKSWAHILI — Chati na Wageni, Lipwa Papo Hapo" },
      { name: "twitter:description", content: "TALKSWAHILI ni jukwaa la kuchat na wageni, kupata kipato kwa kuchat na kufuatilia balance yako." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "canonical", href: "https://talkswahililive.site/" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sw">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://talkswahililive.site/#organization",
                  "name": "TALKSWAHILI",
                  "url": "https://talkswahililive.site/",
                  "logo": "https://talkswahililive.site/favicon.png",
                  "areaServed": "TZ",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://talkswahililive.site/#website",
                  "name": "TALKSWAHILI",
                  "url": "https://talkswahililive.site/",
                  "inLanguage": "sw-TZ",
                  "publisher": { "@id": "https://talkswahililive.site/#organization" },
                },
                {
                  "@type": "WebPage",
                  "@id": "https://talkswahililive.site/#webpage",
                  "url": "https://talkswahililive.site/",
                  "name": "TALKSWAHILI — Chati na Wageni, Lipwa Papo Hapo",
                  "isPartOf": { "@id": "https://talkswahililive.site/#website" },
                  "inLanguage": "sw-TZ",
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

import StackedLayers from "@/components/layout/StackedLayers";
import { Portfolio, Site } from "@/constants/meta";
import type { Metadata } from "next";
import { Merriweather, Montserrat } from "next/font/google";

const montserrat = Montserrat({
  preload: true,
  subsets: ["latin"],
});
const merriweather = Merriweather({
  preload: true,
  subsets: ["latin"],
  weight: ["400"],
});

const SCRIPT_CONTENT = `
(function() {
  window.__onThemeChange = function() {};
  function setTheme(newTheme) {
    window.__theme = newTheme;
    preferredTheme = newTheme;
    document.documentElement.setAttribute("data-theme", newTheme);
    window.__onThemeChange(newTheme);
    setTimeout(() => {
      document.documentElement.classList.add("transition", "duration-500");
    }, 0);
  }

  var preferredTheme;
  try {
    preferredTheme = localStorage.getItem("theme");
  } catch (error) {
    console.error(error);
  }

  window.__setPreferredTheme = function(newTheme) {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error(error);
    }
  };

  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  darkQuery.addListener(function(e) {
    window.__setPreferredTheme(e.matches ? "dark" : "light");
  });

  setTheme(preferredTheme || (darkQuery.matches ? "dark" : "light"));
})();
`;

const { description, title } = Portfolio.METADATA;

export const metadata: Metadata = {
  description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || ""),
  openGraph: {
    description,
    images: [
      {
        url: Site.METADATA.coverImageUrl,
      },
    ],
    title,
  },
  other: {
    version: Date.now(),
  },
  title,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: SCRIPT_CONTENT,
          }}
        />
        <div id="_next" className="relative z-0 flex size-full flex-1 flex-col">
          {children}
        </div>
        <StackedLayers />
        <div id="class-keeper" className="hidden" aria-hidden></div>
      </body>
    </html>
  );
}

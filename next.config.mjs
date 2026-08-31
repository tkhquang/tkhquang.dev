import path from "path";

const __dirname = path.resolve();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    swcPlugins: [
      // ["@swc-jotai/debug-label", {}],
      // ["@swc-jotai/react-refresh", {}],
      ["@swc/plugin-formatjs", {}],
    ],
  },
  async headers() {
    return [
      // !! /settings/deployment-protection#options-allowlist configuratioon required
      {
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
        source: "/assets/styles/external/:path*",
      },
      {
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
        source: "/api/pageviews/badge",
      },
      // Keep the resume out of search results; crawling stays allowed so
      // Google can see the noindex and drop the already-indexed entry
      {
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        source: "/assets/resources/pdf/:path*",
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [25, 50, 75, 100],
    remotePatterns: [
      (() => {
        const { hostname, protocol } = new URL(
          process.env.NEXT_PUBLIC_BASE_URL
        );

        return {
          protocol: protocol.replace(":", ""),
          hostname,
        };
      })(),
      {
        protocol: "https",
        hostname: "i.scdn.co", // Spotify album covers
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  outputFileTracingIncludes: {
    "/blog{,/**/*}": [
      "./content/**",
      "./src/lib/remark-embed/templates/**",
    ],
    "/api/pageviews{,/**/*}": ["./content/posts/**"],
    "/api/pdf{,/**/*}": [
      "node_modules/@sparticuz/chromium/**/*",
      "node_modules/puppeteer-core/**/*",
    ],
  },
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        destination: "/blog/page/1",
        source: "/blog",
      },
      {
        destination: "/blog/page/1",
        source: "/blog/",
      },
    ];
  },
  async redirects() {
    return [
      {
        destination: "/:path*",
        permanent: false,
        source: "/portfolio/:path*",
      },
      {
        source:
          "/blog/posts/get-access-to-children-s-functions-from-parent-component-with-react-hooks/:path*",
        destination:
          "/blog/posts/get-access-to-childrens-functions-from-parent-component-with-react-hooks/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

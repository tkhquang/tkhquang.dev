import path from "path";

const __dirname = path.resolve();

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
  images: {
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
    "/blog{,/**/*}": ["./content/**"],
    "/api/pdf{,/**/*}": [
      "node_modules/@sparticuz/chromium/**/*",
      "node_modules/puppeteer-core/**/*",
    ],
  },
  outputFileTracingRoot: path.join(__dirname),
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

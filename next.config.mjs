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
    remotePatterns: [{ hostname: "tkhquang.dev" }, { hostname: "localhost" }],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  outputFileTracingIncludes: {
    "/blog{,/**/*}": ["./content/**"],
  },
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      {
        destination: "/:path*",
        permanent: false,
        source: "/portfolio/:path*",
      },
    ];
  },
};

export default nextConfig;

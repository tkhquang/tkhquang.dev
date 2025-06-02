import path from "path";

const __dirname = path.resolve();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // swcPlugins: [
    //   ["@swc-jotai/debug-label", {}],
    //   ["@swc-jotai/react-refresh", {}],
    // ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  outputFileTracingIncludes: {
    "/**": ["./public/**"],
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
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;

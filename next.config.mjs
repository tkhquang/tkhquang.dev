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
  outputFileTracingRoot: path.join(__dirname),
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;

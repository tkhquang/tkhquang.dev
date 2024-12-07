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
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;

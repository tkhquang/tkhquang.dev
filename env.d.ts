import "next";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_TOKEN: string;
      GITHUB_API_ENDPOINT: string;
      NEXT_PUBLIC_COMMENTBOX_PROJECT_ID: string;
      NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID: string;
      SPOTIFY_REFRESH_TOKEN: string;
      SPOTIFY_CLIENT_ID: string;
      SPOTIFY_CLIENT_SECRET: string;
      NEXT_PUBLIC_BASE_URL: string;
      NEXT_PUBLIC_WEB3FORM_ACCESS_KEY: string;
      NEXT_PUBLIC_GISCUS_CATEGORY: string;
      NEXT_PUBLIC_GISCUS_CATEGORY_ID: string;
      NEXT_PUBLIC_GISCUS_REPO: string;
      NEXT_PUBLIC_GISCUS_REPOSITORY_ID: string;
      UPSTASH_REDIS_REST_URL: string;
      UPSTASH_REDIS_REST_TOKEN: string;
    }
  }
}

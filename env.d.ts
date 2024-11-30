declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_TOKEN: string;
      GITHUB_API_ENDPOINT: string;
    }
  }
}

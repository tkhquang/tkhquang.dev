import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client/core";

export function createGithubClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      fetch,
      headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      uri: process.env.GITHUB_API_ENDPOINT,
    }),
  });
}

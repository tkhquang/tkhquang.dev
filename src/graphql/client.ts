import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client/core";

export function createGithubClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    link: new HttpLink({
      uri: process.env.GITHUB_API_ENDPOINT,
      headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      fetch,
    }),
    cache: new InMemoryCache(),
  });
}

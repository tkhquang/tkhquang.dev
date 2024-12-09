import {
  GitHubCommitStatsQuery,
  GitHubProjectsQuery,
} from "@/graphql/generated/types";

const fetchGitHubData = async (query: string, revalidate: number = 86400) => {
  const response = await fetch(`${process.env.GITHUB_API_ENDPOINT}`, {
    body: JSON.stringify({ query }),
    cache: "force-cache",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    next: {
      revalidate,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data from GitHub");
  }

  const { data } = await response.json();
  return data;
};

export const fetchGitHubCommitStats =
  async (): Promise<GitHubCommitStatsQuery> => {
    const query = `
    query {
      viewer {
        repositories(
          orderBy: { field: STARGAZERS, direction: DESC }
          isFork: false
          affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
          first: 100
        ) {
          edges {
            node {
              id
              name
              url
              description
              isPrivate
              stargazers {
                totalCount
              }
              forkCount
              primaryLanguage {
                color
                id
                name
              }
              isFork
              updatedAt
              languages(
                orderBy: { field: SIZE, direction: DESC }
                first: 100
              ) {
                edges {
                  node {
                    color
                    id
                    name
                  }
                  size
                }
              }
            }
          }
        }
      }
    }
  `;

    return fetchGitHubData(query);
  };

export const fetchGitHubProjects = async (): Promise<GitHubProjectsQuery> => {
  const query = `
    query {
      viewer {
        repositoriesContributedTo(
          contributionTypes: COMMIT
          first: 100
          orderBy: { field: STARGAZERS, direction: DESC }
        ) {
          edges {
            node {
              forkCount
              id
              url
              name
              nameWithOwner
            }
          }
        }
        repositories(
          orderBy: { field: STARGAZERS, direction: DESC }
          isFork: false
          affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
          first: 100
        ) {
          edges {
            node {
              id
              name
              url
              description
              isPrivate
              stargazers {
                totalCount
              }
              forkCount
              primaryLanguage {
                color
                id
                name
              }
              isFork
              updatedAt
              languages(
                orderBy: { field: SIZE, direction: DESC }
                first: 100
              ) {
                edges {
                  node {
                    color
                    id
                    name
                  }
                  size
                }
              }
            }
          }
        }
      }
    }
  `;

  return fetchGitHubData(query);
};

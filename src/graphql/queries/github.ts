import gql from "graphql-tag";

export const githubCommitStatsQuery = gql`
  query GitHubCommitStats {
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
            languages(orderBy: { field: SIZE, direction: DESC }, first: 100) {
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

export const gitHubProjectsQuery = gql`
  query GitHubProjects {
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
            languages(orderBy: { field: SIZE, direction: DESC }, first: 100) {
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

import { useMemo } from "react";
import { useGraphqlQuery } from "@openimis/fe-core"; // Assurez-vous d'importer useGraphqlQuery correctement
import { useModulesManager } from "@openimis/fe-core"; // Assurez-vous d'importer useModulesManager correctement
import _ from "lodash"; // Assurez-vous d'avoir lodash installé et importé

export const useContributionPlanQuery = (filters, config) => {
  const modulesManager = useModulesManager();
  const { isLoading, error, data, refetch } = useGraphqlQuery(
    `
    query (
      $first: Int, $last: Int, $before: String, $after: String, $isDeleted: Boolean, $showHistory: Boolean,
      $applyDefaultValidityFilter: Boolean, $orderBy: [String]
    ) {
      contributionPlan(
        first: $first, last: $last, before: $before, after: $after, isDeleted: $isDeleted, showHistory: $showHistory,
        applyDefaultValidityFilter: $applyDefaultValidityFilter, orderBy: $orderBy
      ) {
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            code
            name
            calculation
            jsonExt
            benefitPlan
            benefitPlanType
            benefitPlanId
            benefitPlanTypeName
            periodicity
            dateValidFrom
            dateValidTo
            isDeleted
          }
        }
      }
    }
    `,
    filters,
    config,
  );

  const contributionPlan = useMemo(() => (data ? _.map(data.contributionPlan?.edges, "node") : []), [data]);
  const pageInfo = useMemo(
    () => (data ? Object.assign({ totalCount: data.contributionPlan?.totalCount }, data.contributionPlan?.pageInfo) : {}),
    [data],
  );

  return { isLoading, error, data: { contributionPlan, pageInfo }, refetch };
};

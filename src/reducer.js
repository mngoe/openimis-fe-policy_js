import {
    parseData, pageInfo,
    dispatchMutationReq, dispatchMutationResp, dispatchMutationErr,
    formatServerError, formatGraphQLError
} from '@openimis/fe-core';
import { policyBalance, policySumDedRems } from "./utils/utils";

export const reducer = (
    state = {
        fetchingPolicies: false,
        fetchedPolicies: false,
        errorPolicies: null,
        policies: null,
        policiesPageInfo: { totalCount: 0 },
        policy: null,
        fetchingPolicy: null,
        errorPolicy: null,
        fetchedPolicy: false,
        fetchingInsureeEligibility: false,
        fetchedInsureeEligibility: false,
        errorInsureeEligibility: null,
        insureeEligibility: null,
        fetchingItemEligibility: false,
        fetchedInsureeItemEligibility: false,
        errorInsureeItemEligibility: null,
        insureeItemEligibility: null,
        fetchingInsureeItemEligibility: false,
        fetchedInsureeServiceEligibility: false,
        errorInsureeServiceEligibility: null,
        insureeServiceEligibility: null,
        fetchingPolicyValues: false,
        fetchedPolicyValues: false,
        errorPolicyValues: null,
        policyValues: null,
        submittingMutation: false,
        mutation: {},
        fetchingContributionPlans: false,
        errorContributionPlans: null,
        fetchedContributionPlans: false,
        contributionPlans: [],
        contributionPlansPageInfo: {},
        contributionPlansTotalCount: 0,
    },
    action) => {
    switch (action.type) {
        case 'POLICY_POLICY':
            return {
                ...state,
                policy: action.payload,
            };
        case 'INSUREE_FAMILY_OVERVIEW_REQ':
            return {
                ...state,
                fetchingPolicies: false,
                fetchedPolicies: false,
                policies: null,
                policy: null,
                errorPolicies: null,
            }
        case 'POLICY_INSUREE_POLICIES_REQ':
            return {
                ...state,
                fetchingPolicies: true,
                fetchedPolicies: false,
                policies: null,
                policy: null,
                errorPolicies: null,
            };
        case 'POLICY_INSUREE_POLICIES_RESP':
            return {
                ...state,
                fetchingPolicies: false,
                fetchedPolicies: true,
                policies: parseData(action.payload.data.policiesByInsuree),
                policiesPageInfo: pageInfo(action.payload.data.policiesByInsuree),
                errorPolicies: formatGraphQLError(action.payload)
            };
        case 'POLICY_INSUREE_POLICIES_ERR':
            return {
                ...state,
                fetchingPolicies: false,
                errorPolicies: formatServerError(action.payload),
            };
        case 'POLICY_FAMILY_POLICIES_REQ':
            return {
                ...state,
                fetchingPolicies: true,
                fetchedPolicies: false,
                policies: null,
                policy: null,
                errorPolicies: null,
            };
        case 'POLICY_FAMILY_POLICIES_RESP':
            return {
                ...state,
                fetchingPolicies: false,
                fetchedPolicies: true,
                policies: parseData(action.payload.data.policiesByFamily),
                policiesPageInfo: pageInfo(action.payload.data.policiesByFamily),
                errorPolicies: formatGraphQLError(action.payload)
            };
        case 'POLICY_FAMILY_POLICIES_ERR':
            return {
                ...state,
                fetchingPolicies: false,
                errorPolicies: formatServerError(action.payload),
            };
        case 'POLICY_INSUREE_ELIGIBILITY_REQ':
            return {
                ...state,
                fetchingInsureeEligibility: true,
                fetchedInsureeEligibility: false,
                insureeEligibility: null,
                errorInsureeEligibility: null,
            };
        case 'POLICY_INSUREE_ELIGIBILITY_RESP':
            return {
                ...state,
                fetchingInsureeEligibility: false,
                fetchedInsureeEligibility: true,
                insureeEligibility: action.payload.data.policyEligibilityByInsuree,
                errorInsureeEligibility: formatGraphQLError(action.payload),
            };
        case 'POLICY_INSUREE_ELIGIBILITY_ERR':
            return {
                ...state,
                fetchingInsureeEligibility: false,
                errorInsureeEligibility: formatServerError(action.payload),
            };
        case 'POLICY_INSUREE_ITEM_ELIGIBILITY_REQ':
            return {
                ...state,
                fetchingInsureeItemEligibility: true,
                fetchedInsureeItemEligibility: false,
                insureeItemEligibility: null,
                errorInsureeItemEligibility: null,
            };
        case 'POLICY_INSUREE_ITEM_ELIGIBILITY_RESP':
            return {
                ...state,
                fetchingInsureeItemEligibility: false,
                fetchedInsureeItemEligibility: true,
                insureeItemEligibility: action.payload.data.policyItemEligibilityByInsuree,
                errorInsureeItemEligibility: formatGraphQLError(action.payload),
            };
        case 'POLICY_INSUREE_ITEM_ELIGIBILITY_ERR':
            return {
                ...state,
                fetchingInsureeItemEligibility: false,
                errorInsureeItemEligibility: formatServerError(action.payload),
            };
        case 'POLICY_INSUREE_ITEM_ELIGIBILITY_CLEAR':
          return {
            ...state,
            fetchingInsureeItemEligibility: false,
            fetchedInsureeItemEligibility: false,
            insureeItemEligibility: null,
            errorInsureeItemEligibility: null,
          };
        case 'POLICY_INSUREE_SERVICE_ELIGIBILITY_REQ':
            return {
                ...state,
                fetchingInsureeServiceEligibility: true,
                fetchedInsureeServiceEligibility: false,
                insureeServiceEligibility: null,
                errorInsureeServiceEligibility: null,
            };
        case 'POLICY_INSUREE_SERVICE_ELIGIBILITY_RESP':
            return {
                ...state,
                fetchingInsureeServiceEligibility: false,
                fetchedInsureeServiceEligibility: true,
                insureeServiceEligibility: action.payload.data.policyServiceEligibilityByInsuree,
                errorInsureeServiceEligibility: formatGraphQLError(action.payload),
            };
        case 'POLICY_INSUREE_SERVICE_ELIGIBILITY_ERR':
            return {
                ...state,
                fetchingInsureeServiceEligibility: false,
                errorInsureeServiceEligibility: formatServerError(action.payload),
            };
        case 'POLICY_INSUREE_SERVICE_ELIGIBILITY_CLEAR':
          return {
            ...state,
            fetchingInsureeServiceEligibility: false,
            fetchedInsureeServiceEligibility: false,
            insureeServiceEligibility: null,
            errorInsureeServiceEligibility: null,
          };
        case 'POLICY_POLICIES_REQ':
            return {
                ...state,
                fetchingPolicies: true,
                fetchedPolicies: false,
                policies: [],
                errorPolicies: null,
            };
        case 'POLICY_POLICIES_RESP':
            return {
                ...state,
                fetchingPolicies: false,
                fetchedPolicies: true,
                policies: parseData(action.payload.data.policies),
                policiesPageInfo: pageInfo(action.payload.data.policies),
                errorPolicies: formatGraphQLError(action.payload)
            };
        case 'POLICY_POLICIES_ERR':
            return {
                ...state,
                fetching: false,
                error: formatServerError(action.payload)
            };
        case 'POLICY_POLICY_REQ':
            return {
                ...state,
                fetchingPolicy: true,
                fetchedPolicy: false,
                policy: null,
                errorPolicy: null,
            };
        case 'POLICY_POLICY_RESP':
            let policy = parseData(action.payload.data.policies)[0];
            policy.balance = policyBalance(policy);
            policy = policySumDedRems(policy);
            return {
                ...state,
                fetchingPolicy: false,
                fetchedPolicy: true,
                policy,
                errorPolicy: formatGraphQLError(action.payload)
            };
        case 'POLICY_POLICY_ERR':
            return {
                ...state,
                fetchingPolicy: false,
                errorPolicy: formatServerError(action.payload)
            };
        case 'POLICY_FETCH_POLICY_VALUES_REQ':
            return {
                ...state,
                fetchingPolicyValues: true,
                fetchedPolicyValues: false,
                errorPolicyValues: null,
                policyValues: null,
            };
        case 'POLICY_FETCH_POLICY_VALUES_RESP':
            return {
                ...state,
                fetchingPolicyValues: false,
                fetchedPolicyValues: true,
                policyValues: action.payload.data.policyValues,
            };
        case 'POLICY_FETCH_POLICY_VALUES_ERR':
            return {
                ...state,
                fetchingPolicyValues: false,
                errorPolicyValues: formatServerError(action.payload),
            }
        case "CONTRIBUTIONPLAN_CONTRIBUTIONPLANS_REQ":
            return {
                  ...state,
                  fetchingContributionPlans: true,
                  fetchedContributionPlans: false,
                  contributionPlans: [],
                  contributionPlansPageInfo: {},
                  contributionPlansTotalCount: 0,
                  errorContributionPlans: null,
            };
        case "CONTRIBUTIONPLAN_CONTRIBUTIONPLANS_RESP":
            return {
                  ...state,
                  fetchingContributionPlans: false,
                  fetchedContributionPlans: true,
                  contributionPlans: parseData(action.payload.data.contributionPlan)?.map((contributionPlan) => ({
                    ...contributionPlan,
                    benefitPlan: JSON.parse(JSON.parse(contributionPlan.benefitPlan)),
                  })),
                  contributionPlansPageInfo: pageInfo(
                    action.payload.data.contributionPlan
                  ),
                  contributionPlansTotalCount: !!action.payload.data.contributionPlan
                    ? action.payload.data.contributionPlan.totalCount
                    : null,
                  errorContributionPlans: formatGraphQLError(action.payload),
            };
        case "CONTRIBUTIONPLAN_CONTRIBUTIONPLANS_ERR":
            return {
                  ...state,
                  fetchingContributionPlans: false,
                  errorContributionPlans: formatServerError(action.payload),
            };
        case 'POLICY_MUTATION_REQ':
            return dispatchMutationReq(state, action)
        case 'POLICY_MUTATION_ERR':
            return dispatchMutationErr(state, action);
        case 'POLICY_CREATE_POLICY_RESP':
            return dispatchMutationResp(state, "createPolicy", action);
        case 'POLICY_UPDATE_POLICY_RESP':
            return dispatchMutationResp(state, "updatePolicy", action);
        case 'POLICY_RENEW_POLICY_RESP':
            return dispatchMutationResp(state, "renewPolicy", action);
        case 'POLICY_SUSPEND_POLICIES_RESP':
            return dispatchMutationResp(state, "suspendPolicies", action);
        case 'POLICY_DELETE_POLICIES_RESP':
            return dispatchMutationResp(state, "deletePolicies", action);
        default:
            return state;
    }
};

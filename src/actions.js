import {
  graphql,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  toISODate,
  decodeId,
} from "@openimis/fe-core";
import _ from "lodash";

const FAMILY_HEAD_PROJECTION = "headInsuree{id,uuid,chfId,marital,lastName,otherNames,email,phone,dob,gender{code}}";
const POLICY_BY_FAMILY_OR_INSUREE_PROJECTION = [
  "policyUuid",
  "productCode",
  "productName",
  // "contributionPlanCode",
  // "contributionPlanName",
  "officerCode",
  "officerName",
  "enrollDate",
  "effectiveDate",
  "startDate",
  "expiryDate",
  "status",
  "policyValue",
  "balance",
  "ded",
  "dedInPatient",
  "dedOutPatient",
  "ceiling",
  "ceilingInPatient",
  "ceilingOutPatient",
];
const CONTRIBUTIONPLAN_FULL_PROJECTION = (modulesManager) => [
  "id",
  "code",
  "name",
  "calculation",
  "jsonExt",
  "benefitPlan",
  "benefitPlanType",
  "benefitPlanType",
  "benefitPlanTypeName",
  "periodicity",
  "dateValidFrom",
  "dateValidTo",
  "isDeleted",
];

const FAMILY_FULL_PROJECTION = (mm) => [
  "id",
  "uuid",
  "poverty",
  "confirmationNo",
  "confirmationType{code}",
  "familyType{code}",
  "address",
  "validityFrom",
  "validityTo",
  FAMILY_HEAD_PROJECTION,
  "location" + mm.getProjection("location.Location.FlatProjection"),
  "clientMutationId",
];

export function fetchFamilyOrInsureePolicies(mm, filters) {
  let qry = "policiesByFamily";
  let RDX = "POLICY_FAMILY_POLICIES";
  if (filters.filter((f) => f.startsWith("chfId")).length !== 0) {
    qry = "policiesByInsuree";
    RDX = "POLICY_INSUREE_POLICIES";
  }
  let payload = formatPageQueryWithCount(
    qry,
    filters,
    POLICY_BY_FAMILY_OR_INSUREE_PROJECTION
  );
  return graphql(payload, RDX);
}

export function fetchEligibility(chfid) {
  let payload = `
    {
      policyEligibilityByInsuree(chfId:"${chfid}")
      {
        prodId,
        totalAdmissionsLeft, totalVisitsLeft, totalConsultationsLeft, totalSurgeriesLeft, totalDeliveriesLeft, totalAntenatalLeft,
        consultationAmountLeft, surgeryAmountLeft, deliveryAmountLeft, hospitalizationAmountLeft, antenatalAmountLeft
      }
    }
  `;
  return graphql(payload, "POLICY_INSUREE_ELIGIBILITY");
}

export function selectPolicy(policy) {
  return (dispatch) => {
    dispatch({ type: "POLICY_POLICY", payload: policy });
  };
}

export function fetchItemEligibility(chfid, code) {
  let payload = `
    {
      policyItemEligibilityByInsuree(chfId:"${chfid}", itemCode:"${code}")
      {
        minDateItem, itemLeft, isItemOk
      }
    }
  `;
  return graphql(payload, "POLICY_INSUREE_ITEM_ELIGIBILITY");
}

export function itemEligibilityClear() {
  return (dispatch) => {
    dispatch({ type: `POLICY_INSUREE_ITEM_ELIGIBILITY_CLEAR` });
  };
}

export function fetchServiceEligibility(chfid, code) {
  let payload = `
    {
      policyServiceEligibilityByInsuree(chfId:"${chfid}", serviceCode:"${code}")
      {
        minDateService, serviceLeft, isServiceOk
      }
    }
  `;
  return graphql(payload, "POLICY_INSUREE_SERVICE_ELIGIBILITY");
}

export function serviceEligibilityClear() {
  return (dispatch) => {
    dispatch({ type: `POLICY_INSUREE_SERVICE_ELIGIBILITY_CLEAR` });
  };
}

export function fetchPolicySummaries(mm, filters) {
  let projections = [
    "uuid",
    `product{${mm.getRef("product.ProductPicker.projection")}}`,
    `officer{${mm.getRef("policy.PolicyOfficerPicker.projection")}}`,
    `family{${mm
      .getRef("insuree.FamilyPicker.projection")
      .concat([
        `location{${mm.getRef("location.Location.FlatProjection")}}`,
      ])}}`,
    "contributionPlan{id,code,name,calculation,jsonExt,benefitPlanId,benefitPlan,benefitPlanType,benefitPlanType,benefitPlanTypeName,periodicity,dateValidFrom,dateValidTo,isDeleted,}",
    "enrollDate",
    "effectiveDate",
    "startDate",
    "expiryDate",
    "stage",
    "status",
    "value",
    "sumPremiums",
    "validityFrom",
    "validityTo",
  ];
  const payload = formatPageQueryWithCount("policies", filters, projections);
  return graphql(payload, "POLICY_POLICIES");
}

export function fetchPolicyFull(mm, policy_uuid) {
  let projections = [
    "uuid",
    `product{${mm.getRef("product.ProductPicker.projection")}}`,
    `officer{${mm.getRef("policy.PolicyOfficerPicker.projection")}}`,
    `family{${mm
      .getRef("insuree.FamilyPicker.projection")
      .concat([
        `location{${mm.getRef("location.Location.FlatProjection")}}`,
      ])}}`,
    "contributionPlan{id,code,name,calculation,jsonExt,benefitPlanId,benefitPlan,benefitPlanType,benefitPlanType,benefitPlanTypeName,periodicity,dateValidFrom,dateValidTo,isDeleted,}",
    "enrollDate",
    "effectiveDate",
    "startDate",
    "expiryDate",
    "stage",
    "status",
    "value",
    "sumPremiums",
    "claimDedRems{edges { node {dedG dedIp dedOp remG remIp remOp} } }",
    "validityFrom",
    "validityTo",
  ];
  const payload = formatPageQuery(
    "policies",
    [`uuid: "${policy_uuid}"`, "showHistory: true"],
    projections
  );
  return graphql(payload, "POLICY_POLICY");
}
export function fetchContributionPlans(modulesManager, params) {
  const payload = formatPageQueryWithCount(
    "contributionPlan",
    params,
    CONTRIBUTIONPLAN_FULL_PROJECTION(modulesManager)
  );
  return graphql(payload, "CONTRIBUTIONPLAN_CONTRIBUTIONPLANS");
}

export function fetchPolicyValues(policy) {
  console.log('policy obtenu ', policy)
  var exp_date = new Date(
    policy.prevPolicy == undefined
      ? policy.enrollDate
      : policy.prevPolicy.expiryDate
  );
  exp_date.setDate(exp_date.getDate() + 1);

  let params = [
    `stage: "${policy.stage}"`,
    `enrollDate: "${
      policy.stage == "R" ? toISODate(exp_date) : policy.enrollDate
    }T00:00:00"`,
    `productId: ${parseInt(policy.contributionPlan.benefitPlanId)}`,
    `contributionPlanUuid:"${decodeId(policy.contributionPlan.id)}"`,
    `familyId: ${decodeId(policy.family.id)}`,
  ];
  if (!!policy.prevPolicy) {
    params.push(`prevUuid: "${policy.prevPolicy.uuid}"`);
  }
  let projections = ["policy{startDate expiryDate value}", "warnings"];
  const payload = formatQuery("policyValues", params, projections);
  return graphql(payload, "POLICY_FETCH_POLICY_VALUES");
}

function formatPolicyGQL(mm, policy) {
  return `
  ${
    policy.uuid !== undefined && policy.uuid !== null
      ? `uuid: "${policy.uuid}"`
      : ""
  }
  ${policy.isPaid ? `isPaid: ${policy.isPaid}` : ""}
  ${policy.receipt ? `receipt: "${policy.receipt}"` : ""}
  ${policy.payer ? `payerUuid: "${policy.payer.uuid}"` : ""}
  enrollDate: "${policy.enrollDate}"
  startDate: "${policy.startDate}"
  expiryDate: "${policy.expiryDate}"
  productId: ${parseInt(policy.contributionPlan.benefitPlanId)}
  value: "${_.round(policy.value, 2).toFixed(2)}"
  contributionPlanId: "${decodeId(policy.contributionPlan.id)}"
  familyId: ${decodeId(policy.family.id)}
  officerId: ${decodeId(policy.officer.id)}
`;
}

export function createPolicy(mm, policy, clientMutationLabel) {
  console.log("product obtenu ", policy)
  let mutation = formatMutation(
    "createPolicy",
    formatPolicyGQL(mm, policy),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ["POLICY_MUTATION_REQ", "POLICY_CREATE_POLICY_RESP", "POLICY_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function updatePolicy(mm, policy, clientMutationLabel) {
  let mutation = formatMutation(
    "updatePolicy",
    formatPolicyGQL(mm, policy),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  policy.clientMutationId = mutation.clientMutationId;
  return graphql(
    mutation.payload,
    ["POLICY_MUTATION_REQ", "POLICY_UPDATE_POLICY_RESP", "POLICY_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function renewPolicy(mm, policy, clientMutationLabel) {
  let mutation = formatMutation(
    "renewPolicy",
    formatPolicyGQL(mm, policy),
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  policy.clientMutationId = mutation.clientMutationId;
  return graphql(
    mutation.payload,
    ["POLICY_MUTATION_REQ", "POLICY_RENEW_POLICY_RESP", "POLICY_MUTATION_ERR"],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function suspendPolicy(mm, policy, clientMutationLabel) {
  let mutation = formatMutation(
    "suspendPolicies",
    `uuids: ["${policy.policyUuid || policy.uuid}"]`,
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  policy.clientMutationId = mutation.clientMutationId;
  return graphql(
    mutation.payload,
    [
      "POLICY_MUTATION_REQ",
      "POLICY_SUSPEND_POLICIES_RESP",
      "POLICY_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function deletePolicy(mm, policy, clientMutationLabel) {
  let mutation = formatMutation(
    "deletePolicies",
    `uuids: ["${policy.policyUuid || policy.uuid}"]`,
    clientMutationLabel
  );
  var requestedDateTime = new Date();
  policy.clientMutationId = mutation.clientMutationId;
  return graphql(
    mutation.payload,
    [
      "POLICY_MUTATION_REQ",
      "POLICY_DELETE_POLICIES_RESP",
      "POLICY_MUTATION_ERR",
    ],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    }
  );
}

export function fetchFamily(mm, familyUuid, headInsureeChfId) {
  let filters = [];
  if (!!familyUuid) {
    filters.push(`uuid: "${familyUuid}"`, "showHistory: true");
  } else {
    filters.push(`headInsuree_ChfId: "${headInsureeChfId}"`);
  }
  const payload = formatPageQuery(
    "families",
    filters,
    FAMILY_FULL_PROJECTION(mm)
  );
  return graphql(payload, "INSUREE_FAMILY_OVERVIEW");
}

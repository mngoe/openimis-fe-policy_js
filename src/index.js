import React from "react";
import { ListAlt } from "@material-ui/icons";
import PolicyOfficerPicker from "./pickers/PolicyOfficerPicker";
import PolicyStagePicker from "./pickers/PolicyStagePicker";
import PolicyStatusPicker from "./pickers/PolicyStatusPicker";
import PoliciesPage from "./pages/PoliciesPage";
import PolicyPage from "./pages/PolicyPage";
import PolicyNumberInput from "./pickers/PolicyNumberInput";
import PolicyValuesPanel from "./components/PolicyValuesPanel";
import FamilyOrInsureePoliciesSummary from "./components/FamilyOrInsureePoliciesSummary";
import InsureeEligibilitySummary from "./components/InsureeEligibilitySummary";
import InsureeEligibilityEnquiry from "./components/InsureeEligibilityEnquiry";
import InsureePolicyEligibilitySummary from "./components/InsureePolicyEligibilitySummary";
import messages_en from "./translations/en.json";
import messages_fr from "./translations/fr.json";
import { FormattedMessage } from "@openimis/fe-core";
import { reducer } from "./reducer";
import { RIGHT_POLICY } from "./constants";
import { policyMutation } from "./utils/utils";
const ROUTE_POLICY_POLICIES = "policy/policies";
const ROUTE_POLICY_POLICY = "policy/policy";

const DEFAULT_CONFIG = {
  "translations": [
    { key: 'en', messages: messages_en },
    { key: 'fr', messages: messages_fr }
  ],
  "reducers": [{ key: 'policy', reducer }],
  "refs": [
    { key: "policy.PolicyOfficerPicker", ref: PolicyOfficerPicker },
    { key: "policy.PolicyOfficerPicker.projection", ref: ["id", "uuid", "code", "lastName", "otherNames"] },
    { key: "policy.PolicyPicker.projection", ref: ["id", "uuid", "startDate", "product{name, code}", "expiryDate", "value"] },
    { key: "policy.PolicyOfficerPicker.sort", ref: 'officer__code' },
    { key: "policy.PolicyStatusPicker", ref: PolicyStatusPicker },
    { key: "policy.PolicyStatusPicker.projection", ref: null },
    { key: "policy.PolicyStagePicker", ref: PolicyStagePicker },
    { key: "policy.PolicyStagePicker.projection", ref: null },
    { key: "policy.FamilyOrInsureePoliciesSummary", ref: FamilyOrInsureePoliciesSummary },
    { key: "policy.InsureeEligibilitySummary", ref: InsureeEligibilitySummary },
    { key: "policy.InsureeEligibilityEnquiry", ref: InsureeEligibilityEnquiry },
    { key: "policy.InsureePolicyEligibilitySummary", ref: InsureePolicyEligibilitySummary },
    { key: "policy.route.policies", ref: ROUTE_POLICY_POLICIES },
    { key: "policy.route.policy", ref: ROUTE_POLICY_POLICY },
    { key: "policy.PolicyNumberInput", ref: PolicyNumberInput },
  ],
  "core.Router": [
    { path: ROUTE_POLICY_POLICIES, component: PoliciesPage },
    { path: ROUTE_POLICY_POLICY + "/:policy_uuid?/:family_uuid?/:renew?", component: PolicyPage },
  ],
  "policy.Policy.panels": [PolicyValuesPanel],
  "insuree.MainMenu": [
    {
      text: <FormattedMessage module="policy" id="menu.policies" />,
      icon: <ListAlt />,
      route: "/" + ROUTE_POLICY_POLICIES,
      filter: rights => rights.includes(RIGHT_POLICY)
    },
  ],
  "insuree.EnquiryDialog": [FamilyOrInsureePoliciesSummary, InsureeEligibilityEnquiry, InsureeEligibilitySummary],
  "insuree.FamilyOverview.panels": [FamilyOrInsureePoliciesSummary],
  "insuree.FamilyOverview.mutations": [policyMutation]
}

export const PolicyModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
}

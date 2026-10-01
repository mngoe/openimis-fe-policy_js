import _ from "lodash";
import { RIGHT_POLICY_DELETE, RIGHT_POLICY_SUSPEND, RIGHT_POLICY_RENEW, POLICY_STATUS_ACTIVE, RIGHT_POLICY_EXPIRE } from "../constants";
import { canOnPolicy } from "./rights";

export function policyLabel(mm, policy) {
    if (!policy) return "";
    return `${mm.getRef("insuree.familyLabel")(policy.family)} - ${!!policy.startDate ? policy.startDate : " "} : ${policy.expiryDate ? policy.expiryDate : " "}`
}

export function policyBalance(policy) {
    if (!policy) return null;
    return Math.round((policy.value - policy.sumPremiums) * 100) / 100;
}

export function policySumDedRems(policy) {
    if (!!policy.claimDedRems && !!policy.claimDedRems.edges) {
        let sumClaimDedG = 0;
        let sumClaimDedIp = 0;
        let sumClaimDedOp = 0;
        let sumClaimRemG = 0;
        let sumClaimRemIp = 0;
        let sumClaimRemOp = 0;
        policy.claimDedRems.edges.forEach(claimDedRem => {
            sumClaimDedG += claimDedRem.node.dedG || 0;
            sumClaimDedIp += claimDedRem.node.dedIp || 0;
            sumClaimDedOp += claimDedRem.node.dedOp || 0;
            sumClaimRemG += claimDedRem.node.remG || 0;
            sumClaimRemIp += claimDedRem.node.remIp || 0;
            sumClaimRemOp += claimDedRem.node.remOp || 0;
        })
        policy.sumClaimDedG = Math.round(sumClaimDedG * 100) / 100
        policy.sumClaimDedIp = Math.round(sumClaimDedIp * 100) / 100
        policy.sumClaimDedOp = Math.round(sumClaimDedOp * 100) / 100
        policy.sumClaimRemG = Math.round(sumClaimRemG * 100) / 100
        policy.sumClaimRemIp = Math.round(sumClaimRemIp * 100) / 100
        policy.sumClaimRemOp = Math.round(sumClaimRemOp * 100) / 100
    }
    return policy
}

/*
 * The policy actions: `rights` is the global bag, the UBA one applying when an ENROLMENT
 * link covers the village of the policy's family - `family` being that family when the
 * policy row does not carry it (the family overview).
 */
const isActionable = (policy) =>
    !policy.validityTo && (!!policy.uuid || !!policy.policyUuid) && !policy.clientMutationId

export function canDeletePolicy(rights, policy, family = null){
    return isActionable(policy) && canOnPolicy(RIGHT_POLICY_DELETE, policy, family, { rights })
}
export function canRenewPolicy(rights, policy, family = null){
    return isActionable(policy) && canOnPolicy(RIGHT_POLICY_RENEW, policy, family, { rights }) //&& (policy.status === ??)
}
export function canSuspendPolicy(rights, policy, family = null){
    return isActionable(policy) && canOnPolicy(RIGHT_POLICY_SUSPEND, policy, family, { rights }) && policy.status === POLICY_STATUS_ACTIVE
}

export function canForcePolicyExpiration(rights, policy, family = null){
    return isActionable(policy) && canOnPolicy(RIGHT_POLICY_EXPIRE, policy, family, { rights }) && policy.status === POLICY_STATUS_ACTIVE
}

export function policyMutation(state) {
    return !!state.policy && !!state.policy.policies && !!state.policy.policies.filter(p => !!p.clientMutationId).length    
}
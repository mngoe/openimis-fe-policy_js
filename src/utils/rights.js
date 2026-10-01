import { decodeId, hasPerms } from "@openimis/fe-core";

import { UBA_LINK_TYPE_ENROLMENT, UBA_MODEL_LOCATION } from "../constants";

/**
 * Policy rights, and the village they are granted on.
 *
 * An enrolment officer is a user holding the ENROLMENT credential (a UserBusinessAccess
 * link) on one or more villages. The policy rights their role grants them may sit in the
 * *UBA bag* only - valid on the policies of the families of those villages - and never in
 * the global bag `state.core.user.i_user.rights` the screens used to read.
 *
 * Which check for which place (see `docs/rights.md` in the core module):
 *  - navigation level (main menu, policies page and searcher): `hasPermsAnywhere`;
 *  - one policy, or a policy action on one family: `canOnFamily`, i.e. `hasPerms` with a
 *    business map naming the family's village, which falls back to the global bag.
 *
 * The same rules as the insuree module's `utils/rights.js`, kept here as the policy module
 * does not depend on the insuree one. The backend `has_perms` stays the authority.
 */

/** The village of the family a policy (or a family, or an insuree) belongs to. */
export const familyVillage = (family) => family?.location ?? null;

export const policyVillage = (policy, family = null) =>
  familyVillage(policy?.family) ?? familyVillage(family);

/**
 * The business map of a village, under the ENROLMENT credential: its uuid and its primary
 * key (a link stores the latter, the projections carry both).
 */
export const villageAccessRequirements = (village) => {
  if (!village) return [];
  let pk = null;
  try {
    pk = village.id ? decodeId(village.id) : null;
  } catch (e) {
    // not a relay id: the uuid alone will do
  }
  return [village.uuid, pk]
    .filter((ref) => ref !== undefined && ref !== null && ref !== "")
    .map((ref) => [UBA_MODEL_LOCATION, ref, UBA_LINK_TYPE_ENROLMENT]);
};

/**
 * Does the user hold `perms` on the family: globally, or in the UBA bag through an
 * ENROLMENT link on its village ? With no village at hand, the global bag alone.
 */
export const canOnFamily = (perms, family, options = {}) =>
  hasPerms(perms, { ...options, accessRequirements: villageAccessRequirements(familyVillage(family)) });

/** Same, for a policy: on the village of its family (`family` when the policy has none). */
export const canOnPolicy = (perms, policy, family = null, options = {}) =>
  hasPerms(perms, { ...options, accessRequirements: villageAccessRequirements(policyVillage(policy, family)) });

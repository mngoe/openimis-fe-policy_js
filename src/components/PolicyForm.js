import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import moment from "moment";

import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  historyPush, withModulesManager, withHistory, coreAlert, journalize,
  toISODate,
  formatMessageWithValues, formatMessage,
  ProgressOrError, Form, Helmet, coreConfirm,
} from "@openimis/fe-core";
import PolicyMasterPanel from "./PolicyMasterPanel";
import { fetchPolicyFull, fetchPolicyValues, fetchFamily, fetchPolicySummaries, fetchFamilyOrInsureePolicies, updatePolicy, suspendPolicy } from "../actions";
import { policyLabel } from "../utils/utils";
import { HIV_EMAIL, POLICY_STAGE_NEW, POLICY_STAGE_RENEW, POLICY_STATUS_IDLE, RIGHT_POLICY, RIGHT_POLICY_EDIT } from "../constants";

const styles = theme => ({
  page: theme.page,
});

const POLICY_HEAD_PANEL_CONTRIBUTION_KEY = "policy.Policy.headPanel";
const POLICY_VIH_HEAD_PANEL_CONTRIBUTION_KEY = "policy.Policy.hivheadPanel"

class PolicyForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    policy: {},
    newInsuree: true,
    renew: false,
    confirmProduct: false,
    email: "",
    policies: [],
    saving: null
  };

  async initialFamilyFetch() {
    await this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid);
    await this.props.fetchFamilyOrInsureePolicies(this.props.modulesManager, [
      `chfId: "${this.props.family.headInsuree.chfId}"`,
    ]);
    let policies = this.props.policies;
    let fetchedPolicies = [];
    for (let i = 0; i < policies.length; i++) {
      let id = policies[i].policyUuid
      let response = await this.props.fetchPolicySummaries(this.props.modulesManager, [
        `uuid: "${id}"`,
      ]);
      let policy = response.payload.data.policies.edges[0].node;
      fetchedPolicies.push(policy);
    }

    this.setState(() => ({
      policy: this._newPolicy(),
      email: this.props.family.headInsuree.email,
      family: this.props.family,
      policies: fetchedPolicies
    }));
  }



  _newPolicy() {
    let policy = {};
    policy.status = POLICY_STATUS_IDLE;
    policy.stage = POLICY_STAGE_NEW;
    policy.enrollDate = toISODate(moment().toDate());
    policy.jsonExt = {};
    if (!!this.props.family && this.props.family.uuid === this.props.family_uuid) {
      policy.family = this.props.family;
    }
    return policy;
  }

  _renewPolicy(from_policy) {
    let policy = {};
    policy.prevPolicy = from_policy;
    policy.status = POLICY_STATUS_IDLE;
    policy.stage = POLICY_STAGE_RENEW;
    policy.enrollDate = toISODate(moment().toDate());
    policy.family = from_policy.family;
    policy.product = from_policy.product;
    return policy;
  }

  componentDidMount() {
    if (!!this.props.family_uuid && !this.props.policy_uuid)
      this.initialFamilyFetch();
    if (!!this.props.policy_uuid && this.props.policy_uuid !== "_NEW") {
      this.setState(
        (state, props) => ({
          policy_uuid: props.policy_uuid,
          renew: this.props.renew
        }),
        e => this.props.fetchPolicyFull(
          this.props.modulesManager,
          this.props.policy_uuid
        ),
      )
    } else if (!!this.props.renew) {
      this.setState(
        (state, props) => ({
          renew: this.props.renew,
          policy: this._renewPolicy(state.policy),
        })
      )
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.fetchedPolicy !== this.props.fetchedPolicy && !!this.props.fetchedPolicy) {
      var policy = this.props.policy || {};
      if (!!this.state.renew) {
        policy = this._renewPolicy(policy)
      }
      policy.ext = !!policy.jsonExt ? JSON.parse(policy.jsonExt) : {};
      this.setState(
        { policy, policy_uuid: policy.uuid, lockNew: false, newPolicy: !this.props.renew, renew: false },
        e => { if (policy.stage === POLICY_STAGE_RENEW) { this.props.fetchPolicyValues(policy) } }
      );
    } else if (!_.isEqual(prevState.policy.product, this.state.policy.product) || !_.isEqual(prevState.policy.enrollDate, this.state.policy.enrollDate)) {
      if (!this.props.readOnly && !!this.state.policy.product) {
        this.props.fetchPolicyValues(this.state?.policy)
      }
    } else if (!!prevProps.fetchingPolicyValues && !this.props.fetchingPolicyValues && !!this.props.fetchedPolicyValues) {
      this.setState(state => (
        { policy: { ...state.policy, ...this.props.policyValues.policy } }
      ),
        e => {
          if (!_.isEmpty(this.props.policyValues.warnings)) {
            let messages = this.props.policyValues.warnings
            messages.push(formatMessage(this.props.intl, "policy", "policyValues.alert.message"))
            this.props.coreAlert(
              formatMessage(this.props.intl, "policy", "policyValues.alert.title"),
              messages)
          }
        })
    } else if (prevProps.policy_uuid && !this.props.policy_uuid) {
      this.setState({ policy: this._newPolicy(), newPolicy: true, lockNew: false, policy_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    } else if (!prevProps.renew && !!this.props.renew) {
      this.setState(
        (state, props) => ({
          renew: this.props.renew,
          policy: this._renewPolicy(state.policy)
        }),
        e => this.props.fetchPolicyValues(this.state.policy)
      )
    }

    if (!prevProps.confirmed && this.props.confirmed) {
      this.state.confirmedAction && this.state.confirmedAction();
    }
  }

  back = e => {
    const { modulesManager, history, family_uuid } = this.props;
    if (family_uuid) {
      historyPush(modulesManager,
        history,
        "insuree.route.familyOverview",
        [family_uuid]
      );
    } else {
      historyPush(modulesManager,
        history,
        "policy.route.policies"
      );
    }
  }

  onEditedChanged = p => {
    this.setState(state => ({ policy: { ...state.policy, ...p } }))
  }

  canSave = () => {
    if (!this.state.policy.family) return false;
    if (!this.state.policy.product) return false;


   //check if vih insuree have vih policy
    if (this.state.policy.family.headInsuree.email == "newhivuser_XM7dw70J0M3N@gmail.com") {
  if (this.state.policy.product.program.nameProgram != "VIH") return false;
    } else {
  if (this.state.policy.product.program.nameProgram == "VIH") return false;
  }


    //check policy number if is cs product
    if ((this.state.policy.product.program.nameProgram) == "Chèque Santé" || (this.state.policy.product.program.nameProgram) == "Cheque Santé") {
      if (!this.state.policy.policyNumber) return false;
      if(this.state.policy.policyNumber.chequeImportLineStatus === "used") return false;
    }
    if (!this.state.policy.enrollDate) return false;
    if (!this.state.policy.startDate) return false;
    if (!this.state.policy.expiryDate) return false;
    //if (!this.state.policy.value) return false;
    if (!this.state.policy.officer) return false;
    return true;
  }

  _save = (policy) => {

    let policies = this.state.policies
    let previousPolicy = null;
    if (!!policies && policies.length > 0) {
      for (let i = 0; i < policies.length; i++) {
        if (this.state.policy.product.program.id == policies[i].product.program.id && policies[i].status === 2) {
          previousPolicy  = policies[i]
        }
      }
      if (previousPolicy !=null){
        this.setState({
          saving: false
        })
        this.confirmActivePolicy(policy, previousPolicy)

      }else {
        this.setState(
          { lockNew: !policy.uuid }, // avoid duplicates
          e => this.props.save(policy))
      }
    }
    else {
      this.setState(
        { lockNew: !policy.uuid }, // avoid duplicates
        e => this.props.save(policy))
    }
  }

  confirmActivePolicy = (policy, previousPolicy) => {
    let confirmedAction = () => {
      if (previousPolicy != undefined){
        this.props.suspendPolicy(this.props.modulesManager, previousPolicy, formatMessageWithValues(
          this.props.intl,
          "policy",
          "SuspendPolicy.mutationLabel",
          { policy: policyLabel(this.props.modulesManager, previousPolicy) }
      ))
      }

      this.setState(
        { lockNew: !policy.uuid }, // avoid duplicates
        e => this.props.save(policy))
    }


    let confirm = e => this.props.coreConfirm(
      formatMessageWithValues(this.props.intl, "policy", "confirmActivePolicy.title", { label: policyLabel(this.props.modulesManager, previousPolicy) }),
      formatMessageWithValues(this.props.intl, "policy", "confirmActivePolicy.message",
        {
          label: policyLabel(this.props.modulesManager, previousPolicy),
        }),
    );
    this.setState(
      { confirmedAction },
      confirm
    )
  }

  render() {
    const { rights,
      policy_uuid,
      fetchingPolicy, fetchedPolicy, errorPolicy,
      readOnly, renew,
      family,
      policies
    } = this.props;
    console.log('ptops ', this.props)
    const { policy, lockNew } = this.state;
    if (!rights.includes(RIGHT_POLICY)) return null;
    let ro = policy.clientMutationId ||
      lockNew ||
      (!!readOnly && !renew) ||
      !rights.includes(RIGHT_POLICY_EDIT) ||
      (!!policy.status && policy.status !== POLICY_STATUS_IDLE) ||
      !!policy.validityTo
    return (
      <Fragment>
        <Helmet title={formatMessageWithValues(this.props.intl, "policy", "Policy.title", { label: policyLabel(this.props.modulesManager, this.state.policy) })} />
        <ProgressOrError progress={fetchingPolicy} error={errorPolicy} />
        {((!!fetchedPolicy && !!policy && policy.uuid === policy_uuid) || !policy_uuid || policy.stage === POLICY_STAGE_RENEW) &&
          (
            <Form
              module="policy"
              title="Policy.title"
              titleParams={{
                label: policyLabel(
                  this.props.modulesManager, this.state.policy
                )
              }}
              edited_id={policy_uuid}
              edited={this.state.policy}
              reset={this.state.reset}
              back={this.back}
              save={this._save}
              canSave={this.canSave}
              readOnly={ro}
              headPanelContributionsKey={
                !!policy_uuid ?
                  policy.family.headInsuree.email == "newhivuser_XM7dw70J0M3N@gmail.com" ?
                    POLICY_VIH_HEAD_PANEL_CONTRIBUTION_KEY :
                    POLICY_HEAD_PANEL_CONTRIBUTION_KEY :
                  this.state.email == "newhivuser_XM7dw70J0M3N@gmail.com" ?
                    POLICY_VIH_HEAD_PANEL_CONTRIBUTION_KEY :
                    POLICY_HEAD_PANEL_CONTRIBUTION_KEY
              }
              family_uuid={!!policy.family ? policy.family.uuid : null}
              Panels={[PolicyMasterPanel]}
              onEditedChanged={this.onEditedChanged}
              forcedDirty={!ro && (!!this.props.renew || !policy_uuid)}
              policies={this.state.policies}
              saving={this.state.saving}

            />
          )}
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingPolicy: state.policy.fetchingPolicy,
  errorPolicy: state.policy.errorPolicy,
  fetchedPolicy: state.policy.fetchedPolicy,
  policy: state.policy.policy,
  fetchingPolicyValues: state.policy.fetchingPolicyValues,
  fetchedPolicyValues: state.policy.fetchedPolicyValues,
  errorPolicyValues: state.policy.errorPolicyValues,
  policyValues: state.policy.policyValues,
  family: state.insuree.family,
  submittingMutation: state.policy.submittingMutation,
  mutation: state.policy.mutation,
  policies: state.policy.policies,
  confirmed: state.core.confirmed,
})

export default injectIntl(withModulesManager(withHistory(connect(mapStateToProps, { fetchPolicyFull, fetchPolicyValues, fetchPolicySummaries, fetchFamilyOrInsureePolicies, updatePolicy, suspendPolicy, coreConfirm, journalize, coreAlert, fetchFamily })(withTheme(withStyles(styles)(PolicyForm))))));


import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import moment from "moment";

import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  coreAlert,
  Form,
  formatMessage,
  formatMessageWithValues,
  Helmet,
  historyPush,
  journalize,
  ProgressOrError,
  SelectDialog,
  toISODate,
  withHistory,
  withModulesManager,
} from "@openimis/fe-core";
import PolicyMasterPanel from "./PolicyMasterPanel";
import { fetchPolicyFull, fetchPolicyValues, fetchFamily, fetchContributionPlans} from "../actions";
import {
  RIGHT_POLICY,
  RIGHT_POLICY_EDIT,
  POLICY_STAGE_NEW,
  POLICY_STAGE_RENEW,
  POLICY_STATUS_IDLE,
} from "../constants";
import { policyLabel } from "../utils/utils";

const styles = (theme) => ({
  page: theme.page,
});

const POLICY_HEAD_PANEL_CONTRIBUTION_KEY = "policy.Policy.headPanel";

class PolicyForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    policy: {},
    newInsuree: true,
    renew: false,
    confirmProduct: false,
    contributionPlan:{},
  };

  _newPolicy() {
    let policy = {};
    policy.status = POLICY_STATUS_IDLE;
    policy.stage = POLICY_STAGE_NEW;
    policy.enrollDate = toISODate(moment().toDate());
    policy.jsonExt = {};
    policy.isPaid = false;
    if (
      !!this.props.family &&
      this.props.family.uuid === this.props.family_uuid
    ) {
      policy.family = this.props.family;
    }
    return policy;
  }

  async initialFamilyFetch() {
    await this.props.fetchFamily(
      this.props.modulesManager,
      this.props.family_uuid
    );
    await this.props.fetchContributionPlans();
    this.setState(() => ({
      policy: this._newPolicy(),
    }));
  }

  _renewPolicy(from_policy) {
    let policy = {};
    policy.prevPolicy = from_policy;
    policy.status = POLICY_STATUS_IDLE;
    policy.stage = POLICY_STAGE_RENEW;
    policy.enrollDate = toISODate(moment().toDate());
    policy.family = from_policy.family;
    policy.product = from_policy.product;
    policy.contributionPlan= from_policy.contributionPlan
    return policy;
  }

  confirmProduct = () => {
    this.setState((state) => ({
      ...state,
      confirmProduct: true,
    }));
  };

  componentDidMount() {
    if (!!this.props.family_uuid && !this.props.policy_uuid)
      this.initialFamilyFetch();
    if (!!this.props.policy_uuid && this.props.policy_uuid !== "_NEW") {
      this.setState(
        (state, props) => ({
          policy_uuid: props.policy_uuid,
          renew: this.props.renew,
        }),
        (e) =>
          this.props.fetchPolicyFull(
            this.props.modulesManager,
            this.props.policy_uuid
          ),
      );
    } else if (!!this.props.renew) {

      this.setState((state, props) => ({
        renew: this.props.renew,
        policy: this._renewPolicy(state.policy),
      }));
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      prevProps.fetchedPolicy !== this.props.fetchedPolicy &&
      !!this.props.fetchedPolicy
    ) {
      var policy = this.props.policy || {};
      if (!!this.state.renew) {
        policy.startDate = policy.expiryDate;
        policy = this._renewPolicy(policy);
      }
      policy.ext = !!policy.jsonExt ? JSON.parse(policy.jsonExt) : {};
      this.setState(
        {
          policy,
          policy_uuid: policy.uuid,
          lockNew: false,
          newPolicy: !this.props.renew,
          renew: false,
        }
       
      );
    } else if (
      !_.isEqual(prevState.policy.contributionPlan, this.state.policy.contributionPlan) ||
      !_.isEqual(prevState.policy.enrollDate, this.state.policy.enrollDate)
    ) {
      if (!this.props.readOnly && !!this.state.policy.contributionPlan) {
        console.log('fetc here ')
        this.props.fetchPolicyValues(this.state.policy);
      }
    } else if (
      !!prevProps.fetchingPolicyValues &&
      !this.props.fetchingPolicyValues &&
      !!this.props.fetchedPolicyValues
    ) {
      console.log("no there")
      this.setState(
        (state) => ({
          policy: { ...state.policy, ...this.props.policyValues?.policy },
        }),
        (e) => {
          if (!_.isEmpty(this.props.policyValues?.warnings))
            this.confirmProduct();
        }
      );
    } else if (prevProps.policy_uuid && !this.props.policy_uuid) {
      this.setState({
        policy: this._newPolicy(),
        newPolicy: true,
        lockNew: false,
        policy_uuid: null,
      });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    } else if (!prevProps.renew && !!this.props.renew) {
      this.setState(
        (state, props) => ({
          renew: this.props.renew,
          policy: this._renewPolicy(state.policy),
        }),
        (e) => this.props.fetchPolicyValues(this.state.policy)
      );
    }
  }

  back = (e) => {
    const { modulesManager, history, family_uuid } = this.props;
    if (family_uuid) {
      historyPush(modulesManager, history, "insuree.route.familyOverview", [
        family_uuid,
      ]);
    } else {
      historyPush(modulesManager, history, "policy.route.policies");
    }
  };

  onEditedChanged = (p) => {
    this.setState((state) => ({ policy: { ...state.policy, ...p } }));
  };

  onConfirmProductDialog = () => {
    this.setState((state) => ({
      ...state,
      confirmProduct: false,
    }));
  };

  onRejectProductDialog = () => {
    this.setState((state) => ({
      ...state,
      confirmProduct: false,
      policy: {
        ...state.policy,
        contributionPlan: null,
        startDate: null,
        expiryDate: null,
        value: null,
      },
    }));
  };

  canSave = () => {
    if (!this.state.policy.family) return false;
    if (!this.state.policy.contributionPlan) return false;
    if (!this.state.policy.enrollDate) return false;
    if (!this.state.policy.startDate) return false;
    if (!this.state.policy.expiryDate) return false;
    if (!this.state.policy.value) return false;
    if (!this.state.policy.officer) return false;
    return true;
  };

  _save = (policy) => {
    this.setState(
      { lockNew: !policy.uuid }, // avoid duplicates
      (e) => this.props.save(policy)
    );
  };

  render() {
    const {
      rights,
      policy_uuid,
      fetchingPolicy,
      fetchedPolicy,
      errorPolicy,
      readOnly,
      renew,
    } = this.props;
    const { policy, lockNew } = this.state;
    if (!rights.includes(RIGHT_POLICY)) return null;

    let ro =
      policy.clientMutationId ||
      lockNew ||
      (!!readOnly && !renew) ||
      !rights.includes(RIGHT_POLICY_EDIT) ||
      (!!policy.status && policy.status !== POLICY_STATUS_IDLE) ||
      !!policy.validityTo;
    return (
      <Fragment>
        <Helmet
          title={formatMessageWithValues(
            this.props.intl,
            "policy",
            "Policy.title",
            { label: policyLabel(this.props.modulesManager, this.state.policy) }
          )}
        />
        <SelectDialog
          confirmState={this.state.confirmProduct}
          onConfirm={this.onConfirmProductDialog}
          onClose={this.onRejectProductDialog}
          module="policy"
          confirmTitle="policyValues.alert.title"
          confirmMessage="policyValues.alert.message"
          confirmationButton="dialogActions.continue"
          rejectionButton="dialogActions.goBack"
        />
        <ProgressOrError progress={fetchingPolicy} error={errorPolicy} />
        {((!!fetchedPolicy && !!policy && policy.uuid === policy_uuid) ||
          !policy_uuid ||
          policy.stage === POLICY_STAGE_RENEW) && (
          <Form
            module="policy"
            title="Policy.title"
            titleParams={{
              label: policyLabel(this.props.modulesManager, this.state.policy),
            }}
            edited_id={policy_uuid}
            edited={this.state.policy}
            reset={this.state.reset}
            back={this.back}
            save={this._save}
            canSave={this.canSave}
            readOnly={ro}
            headPanelContributionsKey={POLICY_HEAD_PANEL_CONTRIBUTION_KEY}
            family_uuid={!!policy.family ? policy.family.uuid : null}
            Panels={[PolicyMasterPanel]}
            onEditedChanged={this.onEditedChanged}
            forcedDirty={!ro && (!!this.props.renew || !policy_uuid)}
          />
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  fetchingPolicy: state.policy.fetchingPolicy,
  errorPolicy: state.policy.errorPolicy,
  fetchedPolicy: state.policy.fetchedPolicy,
  policy: state.policy.policy,
  fetchingPolicyValues: state.policy.fetchingPolicyValues,
  fetchedPolicyValues: state.policy.fetchedPolicyValues,
  errorPolicyValues: state.policy.errorPolicyValues,
  policyValues: state.policy.policyValues,
  contributionPlan: state.policy.contributionPlan,
  family: state.insuree.family,
  submittingMutation: state.policy.submittingMutation,
  mutation: state.policy.mutation,
});

export default injectIntl(
  withModulesManager(
    withHistory(
      connect(mapStateToProps, {
        fetchPolicyFull,
        fetchPolicyValues,
        journalize,
        coreAlert,
        fetchFamily,
        fetchContributionPlans,
      })(withTheme(withStyles(styles)(PolicyForm)))
    )
  )
);

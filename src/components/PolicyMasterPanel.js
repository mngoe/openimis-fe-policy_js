import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import {
  Paper,
  Grid,
  Typography,
  Divider,
  IconButton,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import {
  Autorenew as RenewIcon,
  Delete as DeleteIcon,
  Pause as SuspendIcon,
} from "@material-ui/icons";
import {
  formatMessage,
  formatMessageWithValues,
  withTooltip,
  withModulesManager,
  historyPush,
  coreConfirm,
  journalize,
  FormattedMessage,
  FormPanel,
  Contributions,
  PublishedComponent,
  ProgressOrError,
  decodeId,
  AmountInput,
  TextInput,
} from "@openimis/fe-core";
import {
  policyLabel,
  canDeletePolicy,
  canSuspendPolicy,
  canRenewPolicy,
} from "../utils/utils";
import { deletePolicy, suspendPolicy } from "../actions";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
});

const POLICY_POLICY_CONTRIBUTION_KEY = "policy.Policy";
const POLICY_POLICY_PANELS_CONTRIBUTION_KEY = "policy.Policy.panels";

class PolicyMasterPanel extends FormPanel {
  constructor(props) {
    super(props);

    this.minimumPolicyEffectiveDate = this.props.modulesManager.getConf(
      "fe-policy",
      "minimumPolicyEffectiveDate",
      0
    );
    this.defaultPaymentType = this.props.modulesManager.getConf(
      "fe-policy",
      "defaultPaymentTypeOfContribution",
      "C"
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.confirmed && this.props.confirmed) {
      this.state.confirmedAction();
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    }
  }

  _onContributionPlanChange = (contributionPlan) => {
    !contributionPlan
      ? this.updateAttributes({
        contributionPlan: null,
          startDate: null,
          expiryDate: null,
          value: null,
        })
      : this.updateAttribute("contributionPlan", contributionPlan);
  };

  renewPolicy = () =>
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "policy.route.policy",
      [this.props.edited.uuid, this.props.edited.family.uuid, true]
    );

  confirmSuspend = () => {
    let policy = this.props.edited;
    let confirmedAction = () =>
      this.props.suspendPolicy(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "SuspendPolicy.mutationLabel",
          { policy: policyLabel(this.props.modulesManager, policy) }
        )
      );
    let confirm = (e) =>
      this.props.coreConfirm(
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "suspendPolicyDialog.title",
          { label: policyLabel(this.props.modulesManager, policy) }
        ),
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "suspendPolicyDialog.message",
          {
            label: policyLabel(this.props.modulesManager, policy),
          }
        )
      );
    this.setState({ confirmedAction }, confirm);
  };

  confirmDelete = () => {
    let policy = this.props.edited;
    let confirmedAction = () =>
      this.props.deletePolicy(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "DeletePolicy.mutationLabel",
          { policy: policyLabel(this.props.modulesManager, policy) }
        )
      );
    let confirm = (e) =>
      this.props.coreConfirm(
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "deletePolicyDialog.title",
          { label: policyLabel(this.props.modulesManager, policy) }
        ),
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "deletePolicyDialog.message",
          {
            label: policyLabel(this.props.modulesManager, policy),
          }
        )
      );
    this.setState({ confirmedAction }, confirm);
  };

  canDelete = (policy) => canDeletePolicy(this.props.rights, policy);
  canSuspend = (policy) => canSuspendPolicy(this.props.rights, policy);
  canRenew = (policy) =>
    !this.props.renew && canRenewPolicy(this.props.rights, policy);

  render() {
    const {
      intl,
      classes,
      edited,
      edited_id,
      readOnly,
      fetchingPolicyValues,
      errorPolicyValues,
      title = "Policy.details.title",
    } = this.props;
    let actions = [];
    if (this.canRenew(edited)) {
      actions.push({
        button: (
          <IconButton onClick={(e) => this.renewPolicy()}>
            <RenewIcon />
          </IconButton>
        ),
        tooltip: formatMessage(
          this.props.intl,
          "policy",
          "action.RenewPolicy.tooltip"
        ),
      });
    }
    if (this.canSuspend(edited)) {
      actions.push({
        button: (
          <IconButton onClick={(e) => this.confirmSuspend()}>
            <SuspendIcon />
          </IconButton>
        ),
        tooltip: formatMessage(
          this.props.intl,
          "policy",
          "action.SuspendPolicy.tooltip"
        ),
      });
    }
    if (this.canDelete(edited)) {
      actions.push({
        button: (
          <IconButton onClick={(e) => this.confirmDelete()}>
            <DeleteIcon />
          </IconButton>
        ),
        tooltip: formatMessage(
          this.props.intl,
          "policy",
          "action.DeletePolicy.tooltip"
        ),
      });
    }

    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
              <Grid item xs={3} className={classes.tableTitle}>
                <Typography>
                  <FormattedMessage module="policy" id={title} />
                </Typography>
              </Grid>
              <Grid item xs={9}>
                <Grid container justify="flex-end">
                  {!!actions &&
                    actions.map((a, idx) => {
                      return (
                        <Grid
                          item
                          key={`form-action-${idx}`}
                          className={classes.paperHeaderAction}
                        >
                          {withTooltip(a.button, a.tooltip)}
                        </Grid>
                      );
                    })}
                </Grid>
              </Grid>
            </Grid>
            <Divider />
            <Grid container className={classes.item}>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={!!edited ? edited.enrollDate : null}
                  module="policy"
                  label="Policy.enrollDate"
                  minDate={
                    !!this.minimumPolicyEffectiveDate
                      ? new Date().setDate(
                          new Date().getDate() - this.minimumPolicyEffectiveDate
                        )
                      : undefined
                  }
                  maxDate={new Date()}
                  readOnly={readOnly}
                  required={true}
                  onChange={(v) => this.updateAttribute("enrollDate", v)}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="core.DatePicker"
                  value={!!edited ? edited.effectiveDate : null}
                  module="policy"
                  label="Policy.effectiveDate"
                  readOnly={true}
                  required={false}
                />
              </Grid>
              {!!fetchingPolicyValues && (
                <Grid item xs={6} className={classes.item}>
                  <ProgressOrError
                    progress={fetchingPolicyValues}
                    error={errorPolicyValues}
                  />
                </Grid>
              )}
              {!fetchingPolicyValues &&
                ["startDate", "expiryDate"].map((date) => (
                  <Grid
                    key={`policy-${date}`}
                    item
                    xs={3}
                    className={classes.item}
                  >
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={!!edited ? edited[date] : null}
                      module="policy"
                      label={`Policy.${date}`}
                      readOnly={true}
                    />
                  </Grid>
                ))}
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="policy.PolicyContributionPlanPicker"
                  value={!!edited && edited.contributionPlan}
                  module="policy"
                  readOnly={!!edited_id || readOnly}
                  withNull={true}
                  label={formatMessage(intl, "contributionPlan", "ContributionPlan")}
                  withLabel={true}
                  nullLabel={formatMessage(intl, "product", "Product.none")}
                  withPlaceholder={true}
                  placeholder={formatMessage(
                    intl,
                    "product",
                    "ProductPicker.placeholder"
                  )}
                  onChange={this._onContributionPlanChange}
                  required={true}
                  locationId={
                    !!edited.family
                      ? decodeId(edited.family?.location?.parent?.parent?.id)
                      : 0
                  }
                  enrollmentDate={edited?.enrollDate ?? null}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="policy.PolicyOfficerPicker"
                  value={!!edited && edited.officer}
                  module="policy"
                  readOnly={readOnly}
                  withPlaceholder={true}
                  withLabel={true}
                  label={formatMessage(
                    intl,
                    "policy",
                    "PolicyOfficerPicker.label"
                  )}
                  placeholder={formatMessage(
                    intl,
                    "policy",
                    "PolicyOfficerPicker.placeholder"
                  )}
                  withNull={true}
                  nullLabel={formatMessage(
                    intl,
                    "policy",
                    "PolicyOfficer.none"
                  )}
                  onChange={(v) => this.updateAttribute("officer", v)}
                  required={true}
                  villageId={
                    !!edited.family ? decodeId(edited.family?.location?.id) : 0
                  }
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef="policy.PolicyStatusPicker"
                  value={!!edited && edited.status}
                  module="policy"
                  readOnly={true}
                  withNull={false}
                  onChange={(v) => this.updateAttribute("status", v)}
                />
              </Grid>
              {!edited_id && (
                <Grid xs={12}>
                  <Grid item xs={3} className={classes.item}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="primary"
                          checked={edited?.isPaid}
                          onChange={(e) =>
                            this.updateAttribute("isPaid", e.target.checked)
                          }
                        />
                      }
                      disabled={readOnly}
                      label={formatMessage(
                        intl,
                        "policy",
                        "Policy.payInOneInstallment"
                      )}
                    />
                  </Grid>
                </Grid>
              )}
              {edited?.isPaid && (
                <>
                  <Grid item xs={12} className={classes.item}>
                    <Typography variant="subtitle1">
                      <FormattedMessage
                        module="policy"
                        id="Policy.contribDetails"
                      />
                    </Typography>
                    <i>
                      <Typography variant="body2">
                        <FormattedMessage
                          module="policy"
                          id="Policy.contribDetails.warning"
                        />
                      </Typography>
                    </i>
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module="contribution"
                      label="contribution.receipt"
                      readOnly={readOnly}
                      value={edited?.receipt}
                      onChange={(receipt) =>
                        this.updateAttribute("receipt", receipt)
                      }
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="payer.PayerPicker"
                      withNull={true}
                      readOnly={readOnly}
                      value={edited?.payer}
                      onChange={(p) => this.updateAttribute("payer", p)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      module="contribution"
                      value={edited?.enrollDate}
                      readOnly
                      label="contribution.payDate"
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <AmountInput
                      module="contribution"
                      label="contribution.amount"
                      readOnly
                      value={edited?.value || 0}
                      displayZero={true}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="contribution.PremiumPaymentTypePicker"
                      withNull={false}
                      readOnly
                      value={this.defaultPaymentType}
                    />
                  </Grid>
                </>
              )}
              <Contributions
                {...this.props}
                updateAttribute={this.updateAttribute}
                contributionKey={POLICY_POLICY_CONTRIBUTION_KEY}
              />
            </Grid>
          </Paper>
          <Contributions
            {...this.props}
            updateAttribute={this.updateAttribute}
            contributionKey={POLICY_POLICY_PANELS_CONTRIBUTION_KEY}
          />
        </Grid>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  fetchingPolicyValues: state.policy.fetchingPolicyValues,
  errorPolicyValues: state.policy.errorPolicyValues,
  confirmed: state.core.confirmed,
  submittingMutation: state.policy.submittingMutation,
  mutation: state.policy.mutation,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { deletePolicy, suspendPolicy, coreConfirm, journalize },
    dispatch
  );
};

export default withModulesManager(
  injectIntl(
    withTheme(
      withStyles(styles)(
        connect(mapStateToProps, mapDispatchToProps)(PolicyMasterPanel)
      )
    )
  )
);

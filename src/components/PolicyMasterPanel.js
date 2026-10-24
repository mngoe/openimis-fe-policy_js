import React, { useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";
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
  Cancel as CancelIcon,
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
  coreAlert,
  graphqlWithVariables,
} from "@openimis/fe-core";
import {
  policyLabel,
  canDeletePolicy,
  canSuspendPolicy,
  canRenewPolicy,
  canForcePolicyExpiration,
} from "../utils/utils";
import { deletePolicy, suspendPolicy, forcePolicyExpiration } from "../actions";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
});

const POLICY_POLICY_CONTRIBUTION_KEY = "policy.Policy";
const POLICY_POLICY_PANELS_CONTRIBUTION_KEY = "policy.Policy.panels";

const CHEQUE_SANTE_PRODUCTS_QUERY = `
  query ChequeSanteTrimesterProducts($location: Int, $enrollmentDate: DateTime) {
    firstTrimester: products(code: "CS-TRI1", first: 1, location: $location, dateFrom_Lte: $enrollmentDate, dateTo_Gte: $enrollmentDate) {
      edges { node { ...TrimesterProductFields } }
    }
    secondTrimester: products(code: "CS-TRI2", first: 1, location: $location, dateFrom_Lte: $enrollmentDate, dateTo_Gte: $enrollmentDate) {
      edges { node { ...TrimesterProductFields } }
    }
    thirdTrimester: products(code: "CS-TRI3", first: 1, location: $location, dateFrom_Lte: $enrollmentDate, dateTo_Gte: $enrollmentDate) {
      edges { node { ...TrimesterProductFields } }
    }
  }

  fragment TrimesterProductFields on ProductGQLType {
    id
    uuid
    code
    name
    maxMembers
    dateFrom
    dateTo
    validityFrom
    validityTo
    location { id }
    program { id code idProgram nameProgram validityDateFrom }
    ageMinimal
    ageMaximal
  }
`;

const ChequeSantePregnancyAgePicker = ({ value, readOnly, onChange, locationId, enrollmentDate }) => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState({ data: null, isLoading: true, error: null });
  const numericLocationId = Number(locationId);
  const location = Number.isInteger(numericLocationId) && numericLocationId > 0 ? numericLocationId : null;
  const enrollmentDateTime = /^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)
    ? `${enrollmentDate}T00:00:00`
    : enrollmentDate || null;

  useEffect(() => {
    let active = true;
    setQuery({ data: null, isLoading: true, error: null });
    dispatch(graphqlWithVariables(
      CHEQUE_SANTE_PRODUCTS_QUERY,
      { location, enrollmentDate: enrollmentDateTime },
      "POLICY_TRIMESTER_PRODUCTS",
    )).then((action) => {
      if (!active) return;
      const error = action.error ? action.payload : action.payload?.errors?.[0];
      setQuery({ data: error ? null : action.payload?.data, isLoading: false, error });
    }).catch((error) => {
      if (active) setQuery({ data: null, isLoading: false, error });
    });
    return () => { active = false; };
  }, [dispatch, location, enrollmentDateTime]);

  const { data, isLoading, error } = query;
  const products = ["firstTrimester", "secondTrimester", "thirdTrimester"]
    .map((key) => data?.[key]?.edges?.[0]?.node)
    .filter(Boolean);
  const productsAvailable = products.length === 3;

  return (
    <>
      <PublishedComponent
        pubRef="policy.PregnancyAgePicker"
        required={true}
        readOnly={readOnly || isLoading || !productsAvailable}
        value={value}
        label="policy.PregnancyAge"
        withPlaceholder={true}
        withNull={false}
        onChange={(age) => onChange(age, products)}
      />
      {!readOnly && <ProgressOrError progress={isLoading} error={error} />}
      {!readOnly && !isLoading && !error && !productsAvailable && (
        <Typography color="error">
          <FormattedMessage module="policy" id="PregnancyAge.productsUnavailable" />
        </Typography>
      )}
    </>
  );
};

class PolicyMasterPanel extends FormPanel {
  state = {
    productError: null
  }

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
      if (this.state.confirmedAction){
        this.state.confirmedAction();
      }
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    }
  }

  _checkAge = (product, insureeAge) => {
    this.updateAttribute("product", product)
    if (!!product.ageMaximal || !!product.ageMinimal) {
      if (!!product.ageMinimal && insureeAge < product.ageMinimal){
        this.setState({ productError: formatMessage(this.props.intl, "policy", "product.invalidMinAge") })
      } else if(!!product.ageMaximal && insureeAge > product.ageMaximal) {
        this.setState({ productError: formatMessage(this.props.intl, "policy", "product.invalidMaxAge") })
      } else {
        this.setState({ productError: null });
      }
    } else this.setState({ productError: null });
  }

  _onPregnancyAgeChange = (age, products) => {
    const ageNum = Number(age);
    const updates = { pregnancyAge: ageNum };
    const currentProduct = this.props.edited?.product;

    if (currentProduct) {
      let targetCode = null;
      if (ageNum >= 1 && ageNum <= 15) {
        targetCode = "CS-TRI1";
      } else if (ageNum >= 16 && ageNum <= 27) {
        targetCode = "CS-TRI2";
      } else if (ageNum >= 28 && ageNum <= 42) {
        targetCode = "CS-TRI3";
      }

      const targetProduct = products.find((product) => product.code === targetCode);
      if (targetProduct && currentProduct.code !== targetProduct.code) {
        updates.product = targetProduct;
      }
    }

    this.updateAttributes(updates);
  };

  _onProductChange = (product) => {
    const { insureeAge } = this.props;
    !product
      ? this.updateAttributes({
        product: null,
        startDate: null,
        expiryDate: null,
        value: null,
      })
      : this._checkAge(product, insureeAge)
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

  confirmForceExpiration = () => {
    let policy = this.props.edited;
    let confirmedAction = () =>
      this.props.forcePolicyExpiration(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(this.props.intl, "policy", "ForcePolicyExpiration.mutationLabel", {
          policy: policyLabel(this.props.modulesManager, policy),
        })
      );
    
    let confirm = (e) =>
      this.props.coreConfirm(
        formatMessageWithValues(this.props.intl, "policy", "forcePolicyExpirationDialog.title", {
          label: policyLabel(this.props.modulesManager, policy),
        }),
        formatMessageWithValues(this.props.intl, "policy", "forcePolicyExpirationDialog.message", {
          label: policyLabel(this.props.modulesManager, policy),
        })
      );
    this.setState({ confirmedAction }, confirm);
  }

  canDelete = (policy) => canDeletePolicy(this.props.rights, policy);
  canSuspend = (policy) => canSuspendPolicy(this.props.rights, policy);
  canRenew = (policy) =>
    !this.props.renew && canRenewPolicy(this.props.rights, policy);
  canForceExpiration = (policy) => canForcePolicyExpiration(this.props.rights, policy);

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
    const enrollmentDateRequiredError =
      !!edited?.family && !edited?.enrollDate
        ? formatMessage(intl, "policy", "ProductPicker.enrollmentDateRequired")
        : null;
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
    if(this.canForceExpiration(edited)) {
      actions.push({
        button: (
          <IconButton onClick={(e) => this.confirmForceExpiration()}>
            <CancelIcon />
          </IconButton>
        ),
        tooltip: formatMessage(
          this.props.intl,
          "policy",
          "action.ForcePolicyExpiration.tooltip"
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
                  pubRef="product.ProductPicker"
                  value={!!edited && edited.product}
                  module="policy"
                  readOnly={!!edited_id || readOnly}
                  withNull={true}
                  label={formatMessage(intl, "product", "Product")}
                  withLabel={true}
                  nullLabel={formatMessage(intl, "product", "Product.none")}
                  withPlaceholder={true}
                  placeholder={formatMessage(
                    intl,
                    "product",
                    "ProductPicker.placeholder"
                  )}
                  onChange={this._onProductChange}
                  required={true}
                  canFetch={Boolean(edited?.family && edited?.enrollDate)}
                  locationId={
                    !!edited.family
                      ? decodeId(edited.family?.location?.parent?.parent?.id)
                      : 0
                  }
                  enrollmentDate={edited?.enrollDate ?? null}
                  invalidAgeError={this.state.productError || enrollmentDateRequiredError}
                />
              </Grid>
              {(!!edited.product && (edited.product?.program?.nameProgram === "Cheque Santé" || edited.product?.program?.nameProgram === "Chèque Santé")) ? (
                <>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="policy.PolicyNumberInput"
                      module="policy"
                      label="policy.PolicyNumber"
                      required={true}
                      readOnly={!!edited_id || readOnly}
                      value={!!edited && edited.policyNumber}
                      new_policy={!edited?.id}
                      onChange={(v) => this.updateAttribute("policyNumber", v)}
                    />
                  </Grid>
                  <Grid item xs={2} className={classes.item}>
                    <ChequeSantePregnancyAgePicker
                      readOnly={readOnly}
                      value={!!edited && edited.pregnancyAge}
                      onChange={this._onPregnancyAgeChange}
                      locationId={
                        !!edited.family
                          ? decodeId(edited.family?.location?.parent?.parent?.id)
                          : 0
                      }
                      enrollmentDate={edited?.enrollDate ?? null}
                    />
                  </Grid>
                </>
              ): null}
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
    { deletePolicy, suspendPolicy, forcePolicyExpiration, coreConfirm, journalize },
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

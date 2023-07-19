import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import clsx from "clsx";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Divider, Grid, Paper, Typography, FormControlLabel, Checkbox, IconButton } from "@material-ui/core";
import { Add as AddIcon, Autorenew as RenewIcon, Delete as DeleteIcon, Pause as SuspendIcon } from "@material-ui/icons";
import {
  Table,
  PagedDataHandler,
  formatMessage,
  formatMessageWithValues,
  formatDateFromISO,
  withModulesManager,
  formatSorter,
  sort,
  withTooltip,
  historyPush,
  withHistory,
  coreConfirm,
  journalize,
} from "@openimis/fe-core";
import { fetchFamilyOrInsureePolicies, selectPolicy, deletePolicy, suspendPolicy } from "../actions";
import { policyLabel, canDeletePolicy, canSuspendPolicy, canRenewPolicy } from "../utils/utils";
import { RIGHT_POLICY_ADD } from "../constants";

const styles = (theme) => ({
  paper: {
    ...theme.paper.paper,
  },
  paperHeader: {
    ...theme.paper.header,
  },
  tableTitle: theme.table.title,
  title: {
    ...theme.table.title,
    padding: 0,
  },
  fab: theme.fab,
  button: {
    margin: theme.spacing(1),
  },
  item: {
    padding: theme.spacing(1),
  },
});

class FamilyOrInsureePoliciesSummary extends PagedDataHandler {
  constructor(props) {
    super(props);
    this.rowsPerPageOptions = props.modulesManager.getConf(
      "fe-policy",
      "familyOrInsureePoliciesSummary.rowsPerPageOptions",
      [5, 10, 20]
    );
    this.defaultPageSize = props.modulesManager.getConf(
      "fe-policy",
      "familyOrInsureePoliciesSummary.defaultPageSize",
      5
    );
    this.showBalance = props.modulesManager.getConf("fe-policy", "familyOrInsureePoliciesSummary.showBalance", false);
  }

  componentDidMount() {
    this.setState(
      {
        confirmedAction: null,
        onlyActiveOrLastExpired: true,
        orderBy: "expiryDate",
      },
      (e) => this.query()
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.insureeChanged(prevProps) || this.familyChanged(prevProps)) {
      this.query();
    } else if (!prevProps.confirmed && this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState({ reset: this.state.reset + 1 });
    }
  }

  addNewPolicy = () =>
    historyPush(this.props.modulesManager, this.props.history, "policy.route.policy", [
      "_NEW_",
      this.props.family.uuid,
    ]);

  renewPolicy = (i) =>
    historyPush(this.props.modulesManager, this.props.history, "policy.route.policy", [
      i.policyUuid,
      this.props.family.uuid,
      true,
    ]);

  confirmSuspend = (policy) => {
    policy.family = this.props.family;
    let confirmedAction = () =>
      this.props.suspendPolicy(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(this.props.intl, "policy", "SuspendPolicy.mutationLabel", {
          policy: policyLabel(this.props.modulesManager, policy),
        })
      );
    let confirm = (e) =>
      this.props.coreConfirm(
        formatMessageWithValues(this.props.intl, "policy", "suspendPolicyDialog.title", {
          label: policyLabel(this.props.modulesManager, policy),
        }),
        formatMessageWithValues(this.props.intl, "policy", "suspendPolicyDialog.message", {
          label: policyLabel(this.props.modulesManager, policy),
        })
      );
    this.setState({ confirmedAction }, confirm);
  };

  confirmDelete = (policy) => {
    let confirmedAction = () =>
      this.props.deletePolicy(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(this.props.intl, "policy", "DeletePolicy.mutationLabel", {
          policy: policyLabel(this.props.modulesManager, policy),
        })
      );
    let confirm = (e) =>
      this.props.coreConfirm(
        formatMessageWithValues(this.props.intl, "policy", "deletePolicyDialog.title", {
          label: policyLabel(this.props.modulesManager, policy),
        }),
        formatMessageWithValues(this.props.intl, "policy", "deletePolicyDialog.message", {
          label: policyLabel(this.props.modulesManager, policy),
        })
      );
    this.setState({ confirmedAction }, confirm);
  };

  onDoubleClick = (i, newTab = false) => {
    historyPush(this.props.modulesManager, this.props.history, "policy.route.policy", [
      i.policyUuid,
      this.props.family.uuid,
    ]);
  };

  insureeChanged = (prevProps) =>
    (!prevProps.insuree && !!this.props.insuree) ||
    (!!prevProps.insuree && !this.props.insuree) ||
    (!!prevProps.insuree &&
      !!this.props.insuree &&
      !!this.props.insuree.chfId &&
      (prevProps.insuree.chfId == null || prevProps.insuree.chfId !== this.props.insuree.chfId));
  familyChanged = (prevProps) =>
    (!prevProps.family && !!this.props.family) ||
    (!!prevProps.family && !this.props.family) ||
    (!!prevProps.family &&
      !!this.props.family &&
      !!this.props.family.uuid &&
      (prevProps.family.uuid == null || prevProps.family.uuid !== this.props.family.uuid));

  queryPrms() {
    let prms = [`orderBy: "${this.state.orderBy}"`, `activeOrLastExpiredOnly: ${!!this.state.onlyActiveOrLastExpired}`];
    if (!!this.props.insuree && !!this.props.insuree.chfId) {
      prms.push(`chfId:"${this.props.insuree.chfId}"`);
      return prms;
    } else if (!!this.props.family && !!this.props.family.uuid) {
      prms.push(`familyUuid:"${this.props.family.uuid}"`);
      return prms;
    }
  }

  onChangeSelection = (i) => {
    this.props.selectPolicy(i[0] || null);
  };

  toggleCheckbox = (key) => {
    this.setState(
      (state, props) => ({
        [key]: !state[key],
      }),
      (e) => this.query()
    );
  };

  headers = () => {
    let h = [
      "policies.productCode",
      "policies.productName",
      "policies.expiryDate",
      "policies.status"
    ];
    if (this.showBalance) {
      h.push("policies.balance");
    }
    h.push("", "", "");
    return h;
  };

  sorter = (attr, asc = true) => [
    () =>
      this.setState(
        (state, props) => ({ orderBy: sort(state.orderBy, attr, asc) }),
        (e) => this.query()
      ),
    () => formatSorter(this.state.orderBy, attr, asc),
  ];

  headerActions = () => {
    let a = [
      this.sorter("productCode"),
      this.sorter("productName"),
      this.sorter("expiryDate"),
      this.sorter("status"),
    ];
    if (this.showBalance) {
      a.push(this.sorter("balance"));
    }
    return a;
  };

  rowLocked = (policy) => !!policy.clientMutationId;
  canDelete = (policy) => !this.props.readOnly && canDeletePolicy(this.props.rights, policy);
  canSuspend = (policy) => !this.props.readOnly && canSuspendPolicy(this.props.rights, policy);
  canRenew = (policy) => !this.props.readOnly && canRenewPolicy(this.props.rights, policy);

  itemFormatters = () => {
    let f = [
      (i) => i.productCode,
      (i) => i.productName,
      (i) => formatDateFromISO(this.props.modulesManager, this.props.intl, i.expiryDate),
      (i) => formatMessage(this.props.intl, "policy", `policies.status.${i.status}`),
    ];
    if (this.showBalance) {
      f.push((i) => i.balance);
    }
    f.push((i) =>
      !this.props.readOnly && this.canRenew(i)
        ? withTooltip(
          <IconButton onClick={(e) => this.renewPolicy(i)}>
            <RenewIcon />
          </IconButton>,
          formatMessage(this.props.intl, "policy", "action.RenewPolicy.tooltip")
        )
        : null
    );
    f.push((i) =>
      !this.props.readOnly && this.canSuspend(i)
        ? withTooltip(
          <IconButton onClick={(e) => this.confirmSuspend(i)}>
            <SuspendIcon />
          </IconButton>,
          formatMessage(this.props.intl, "policy", "action.SuspendPolicy.tooltip")
        )
        : null
    );
    f.push((i) =>
      !this.props.readOnly && this.canDelete(i)
        ? withTooltip(
          <IconButton onClick={(e) => this.confirmDelete(i)}>
            <DeleteIcon />
          </IconButton>,
          formatMessage(this.props.intl, "policy", "action.DeletePolicy.tooltip")
        )
        : null
    );
    return f;
  };

  header = () => {
    const { intl, pageInfo, insuree } = this.props;
    if (insuree?.chfId) {
      return formatMessageWithValues(intl, "policy", "policiesOfInsuree.header", {
        count: pageInfo.totalCount,
        chfId: insuree.chfId,
      });
    } else {
      return formatMessageWithValues(intl, "policy", "policies.header", { count: pageInfo.totalCount });
    }
  };

  canAdd = () => {
    if (this.props.policies != null && this.props.policies.length != "0") return false;
    return true;
  };

  itemIdentifier = (i) => i.policyUuid;

  render() {
    const {
      intl,
      classes,
      rights,
      fetchingPolicies,
      policies,
      pageInfo,
      errorPolicies,
      family,
      insuree,
      readOnly,
      className,
    } = this.props;
    if ((!family || !family.uuid) && (!insuree || !insuree.uuid)) {
      return null;
    }

    let actions =
      !!readOnly || !rights.includes(RIGHT_POLICY_ADD) ? []
        : [
          {
            button: (
              <IconButton onClick={this.addNewPolicy}>
                <AddIcon />
              </IconButton>
            ),
            tooltip: formatMessage(intl, "policy", "action.AddPolicy.tooltip"),
          },
        ];

    return (
      <Paper className={clsx(classes.paper, className)}>
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          className={clsx(classes.paperHeader, classes.tableTitle)}
        >
          <Grid item>
            <Typography className={classes.title}>{this.header()}</Typography>
          </Grid>
          <Grid item>
            <Grid container alignItems="center" spacing={3}>
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={!!this.state.onlyActiveOrLastExpired}
                      onChange={(e) => this.toggleCheckbox("onlyActiveOrLastExpired")}
                    />
                  }
                  label={formatMessage(intl, "policy", "policies.onlyActiveOrLastExpired")}
                />
              </Grid>
              {actions.map((a, idx) => {
                return (
                  <Grid item key={`form-action-${idx}`}>
                    {withTooltip(a.button, a.tooltip)}
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
        <Divider />
        <Table
          module="policy"
          headers={this.headers()}
          headerActions={this.headerActions()}
          itemFormatters={this.itemFormatters()}
          itemIdentifier={this.itemIdentifier}
          items={policies}
          fetching={fetchingPolicies}
          error={errorPolicies}
          withSelection={"single"}
          onChangeSelection={this.onChangeSelection}
          onDoubleClick={this.onDoubleClick}
          withPagination={true}
          rowsPerPageOptions={this.rowsPerPageOptions}
          defaultPageSize={this.defaultPageSize}
          page={this.state.page}
          pageSize={this.state.pageSize}
          count={pageInfo.totalCount}
          onChangePage={this.onChangePage}
          onChangeRowsPerPage={this.onChangeRowsPerPage}
          rowLocked={this.rowLocked}
        />
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingPolicies: state.policy.fetchingPolicies,
  fetchedPolicies: state.policy.fetchedPolicies,
  policies: state.policy.policies,
  pageInfo: state.policy.policiesPageInfo,
  errorPolicies: state.policy.errorPolicies,
  family: state.insuree.family || {},
  insuree: state.insuree.insuree,
  confirmed: state.core.confirmed,
  submittingMutation: state.policy.submittingMutation,
  mutation: state.policy.mutation,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetch: fetchFamilyOrInsureePolicies, selectPolicy, deletePolicy, suspendPolicy, coreConfirm, journalize },
    dispatch
  );
};

export default withHistory(
  withModulesManager(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withTheme(withStyles(styles)(FamilyOrInsureePoliciesSummary))))
  )
);

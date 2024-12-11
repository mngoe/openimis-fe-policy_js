import React, { Component } from "react";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Paper, Grid, Typography, Divider } from "@material-ui/core";
import {
  FormattedMessage,
  Contributions,
  AmountInput,
  ProgressOrError,
} from "@openimis/fe-core";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  itemcenter: {
    ...theme.paper.item,
    textAlign: "center",
  },
});

const POLICY_POLICY_VALUES_CONTRIBUTION_KEY = "policy.PolicyValues";
const POLICY_POLICY_VALUES_PANELS_CONTRIBUTION_KEY =
  "policy.PolicyValues.panels";

class PolicyValuesPanel extends Component {
  render() {
    const {
      classes,
      title = "Policy.values.title",
      contributionPanelReadOnly = true,
      edited,
      fetchingPolicyValues,
      errorPolicyValues,
    } = this.props;

    let readOnly = contributionPanelReadOnly;
    return (
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          <Grid container className={classes.tableTitle}>
            <Grid item className={classes.tableTitle}>
              <Typography>
                <FormattedMessage module="policy" id={title} />
              </Typography>
            </Grid>
          </Grid>
          <Divider />
          <Grid container className={classes.item}>
            <Grid container alignItems="center" justify="start">
              <Grid item xs={3} className={classes.item}>
                <ProgressOrError
                  progress={fetchingPolicyValues}
                  error={errorPolicyValues}
                />
                {!fetchingPolicyValues && (
                  <AmountInput
                    module="policy"
                    label="Policy.value"
                    value={edited.value}
                    readOnly={readOnly}
                  />
                )}
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <AmountInput
                  module="policy"
                  label="Policy.sumPremiums"
                  value={edited.sumPremiums || 0}
                  displayZero={true}
                  readOnly={readOnly}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <AmountInput
                  module="policy"
                  label="Policy.balance"
                  value={edited.balance || 0}
                  displayZero={true}
                  readOnly={readOnly}
                />
              </Grid>
            </Grid>
            <Grid container alignItems="center">
              <Grid item xs={12}>
                <Divider style={{ margin: "10px 0" }} />
              </Grid>
              <Grid item xs={3} />
              <Grid item xs={3} className={classes.itemcenter}>
                <Typography variant="body1">General</Typography>
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <Typography variant="body1">In-Patient</Typography>
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <Typography variant="body1">Out-Patient</Typography>
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <Typography variant="body1">Deductible</Typography>
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <AmountInput value={edited.sumClaimDedG} readOnly={readOnly} />
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <AmountInput value={edited.sumClaimDedIp} readOnly={readOnly} />
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <AmountInput value={edited.sumClaimDedOp} readOnly={readOnly} />
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <Typography variant="body1">Remunerated Health Care</Typography>
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <AmountInput value={edited.sumClaimRemG} readOnly={readOnly} />
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <AmountInput
                  value={edited.sunmClaimRemIp}
                  readOnly={readOnly}
                />
              </Grid>
              <Grid item xs={3} className={classes.itemcenter}>
                <AmountInput value={edited.sumClaimRemOp} readOnly={readOnly} />
              </Grid>
            </Grid>
            <Contributions
              {...this.props}
              updateAttribute={this.updateAttribute}
              contributionKey={POLICY_POLICY_VALUES_CONTRIBUTION_KEY}
            />
          </Grid>
        </Paper>
        <Contributions
          {...this.props}
          updateAttribute={this.updateAttribute}
          contributionKey={POLICY_POLICY_VALUES_PANELS_CONTRIBUTION_KEY}
        />
      </Grid>
    );
  }
}
const mapStateToProps = (state) => ({
  fetchingPolicyValues: state.policy.fetchingPolicyValues,
  fetchedPolicyValues: state.policy.fetchedPolicyValues,
  errorPolicyValues: state.policy.errorPolicyValues,
  policyValues: state.policy.policyValues,
});

export default withTheme(
  withStyles(styles)(connect(mapStateToProps)(PolicyValuesPanel))
);

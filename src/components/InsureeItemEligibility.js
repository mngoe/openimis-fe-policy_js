import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Box, Grid, Typography } from "@material-ui/core";
import { FormattedMessage, ProgressOrError, PublishedComponent, withModulesManager } from "@openimis/fe-core";
import {fetchItemEligibility, itemEligibilityClear} from "../actions";
import Eligibility from "./Eligibility";

const styles = (theme) => ({
  item: {
    padding: 10,
  },
  header: {
    padding: 10,
    paddingBottom: 0,
    fontWeight: 500,
  },
  section: {
    padding: 10,
  },
});

class InsureeItemEligibility extends Component {
  onItemSelected = (item) => {
    const { insuree } = this.props;
    if (item) {
      this.props.fetchItemEligibility(insuree.chfId, item.code);
    } else {
      this.props.itemEligibilityClear();
    }
  };

  componentWillUnmount() {
    this.props.itemEligibilityClear();
  }

  render() {
    const { classes, isFetching, isFetched, eligibility, error, className } = this.props;
    return (
      <div className={className}>
        <Box>
          <Typography className={classes.header}>
            <FormattedMessage module="policy" id="insureeEligibility.item" />
          </Typography>
        </Box>
        <Grid container className={classes.section} alignItems="center">
          <Grid item xs={6}>
            <Box mr={3}>
              <PublishedComponent
                pubRef="medical.ItemPicker"
                onChange={this.onItemSelected}
                withLabel={false}
                withPlaceholder={true}
              />
            </Box>
          </Grid>
          <ProgressOrError size={16} progress={isFetching} error={error} />
          <Box flexGrow={1}>
            {isFetched && !error && (
              <Eligibility
                minDate={eligibility.minServiceDate}
                remaining={eligibility.itemLeft}
                isOk={eligibility.isItemOk}
              />
            )}
          </Box>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  eligibility: state.policy.insureeItemEligibility,
  isFetching: state.policy.fetchingInsureeItemEligibility,
  isFetched: state.policy.fetchedInsureeItemEligibility,
  error: state.policy.errorInsureeItemEligibility,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchItemEligibility, itemEligibilityClear }, dispatch);
};

export default withModulesManager(
  connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(InsureeItemEligibility)))
);

import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import PrintIcon from "@material-ui/icons/ListAlt";
import {
  historyPush,
  withModulesManager,
  withHistory,
  decodeId,
  clearCurrentPaginationPage,
} from "@openimis/fe-core";
import PolicySearcher from "../components/PolicySearcher";
import { print, printMembershipCard } from "../actions";

const styles = (theme) => ({
  page: theme.page,
});

class PoliciesPage extends Component {
  onDoubleClick = (p, newTab = false) => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "policy.route.policy",
      [p.uuid],
      newTab
    );
  };

  componentDidMount = () => {
    const moduleName = "policy";
    const { module } = this.props;
    if (module !== moduleName) this.props.clearCurrentPaginationPage();
  };

  printSelected = (selection) => {
    this.props.print(selection.map((i) => decodeId(i.family.headInsuree.id)));
  };

  printMembershipCardSelected = (selection) => {
    this.props.printMembershipCard(selection.map((i) => decodeId(i.family.headInsuree.id)));
  };

  canPrintSelected = (selection) =>
    !!selection && selection.length;

  render() {
    const { classes } = this.props;
    var actions = [];
    actions.push({
      label: "policySummaries.printMembershipCardSelected",
      action: this.printSelected,
      enabled: this.canPrintSelected,
      icon: <PrintIcon />,
    });

    actions.push({
      label: "policySummaries.rightCertificate",
      action: this.printMembershipCardSelected,
      enabled: this.canPrintSelected,
      icon: <PrintIcon />,
    });

    return (
      <div className={classes.page}>
        <PolicySearcher
          cacheFiltersKey="policyPoliciesPageFiltersCache"
          onDoubleClick={this.onDoubleClick}
          actions={actions}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  module: state.core?.savedPagination?.module,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      print,
      printMembershipCard,
      clearCurrentPaginationPage
    },
    dispatch,
  );
};

export default injectIntl(
  withModulesManager(
    withHistory(
      connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(PoliciesPage)))
    )
  )
);

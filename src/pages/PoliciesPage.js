import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  historyPush,
  withModulesManager,
  withHistory,
  clearCurrentPaginationPage,
} from "@openimis/fe-core";
import PolicySearcher from "../components/PolicySearcher";

const styles = (theme) => ({
  page: theme.page,
});

class PoliciesPage extends Component {
  constructor(props) {
    super(props);
    let defaultFilters = {};
    this.state = {
      defaultFilters,
    };
  }
  
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

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.page}>
        <PolicySearcher
          cacheFiltersKey="policyPoliciesPageFiltersCache"
          onDoubleClick={this.onDoubleClick}
          defaultFilters = {this.state.defaultFilters}
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

const mapDispatchToProps = (dispatch) => bindActionCreators({ clearCurrentPaginationPage }, dispatch);

export default injectIntl(
  withModulesManager(
    withHistory(
      connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(PoliciesPage)))
    )
  )
);

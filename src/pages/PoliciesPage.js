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
  decodeId
} from "@openimis/fe-core";
import PolicySearcher from "../components/PolicySearcher";
import PrintIcon from "@material-ui/icons/ListAlt";
import { print } from "../actions";
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
  constructor(props) {
    super(props);
    this.printSelected = this.printSelected.bind(this);
  }

  componentDidMount = () => {
    const moduleName = "policy";
    const { module } = this.props;
    if (module !== moduleName) this.props.clearCurrentPaginationPage();
  };

  printSelected(selection) {
    let idList = [];
    selection.forEach((selected) => {
      let id = selected.family.headInsuree.id;
      if (id != null) {
        idList.push(id)
      }
    });
    idList.forEach(id => {
      this.props.print(decodeId(id))
    });
  }

  canPrintSelected = (selection) =>
  !!selection && selection.length;

  render() {
    const { classes } = this.props;
    var actions = [];
    actions.push({
      label: "policy.printSelected",
      action: this.printSelected,
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

const mapDispatchToProps = (dispatch) => bindActionCreators({ clearCurrentPaginationPage, print }, dispatch);

export default injectIntl(
  withModulesManager(
    withHistory(
      connect(mapStateToProps, mapDispatchToProps)(withTheme(withStyles(styles)(PoliciesPage)))
    )
  )
);

import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  historyPush,
  withModulesManager,
  withHistory,
  formatMessageWithValues,
} from "@openimis/fe-core";
import PolicyForm from "../components/PolicyForm";
import { policyLabel } from "../utils/utils";
import { createPolicy, renewPolicy, updatePolicy } from "../actions";
import { POLICY_STAGE_NEW, POLICY_STAGE_RENEW } from "../constants";

const styles = (theme) => ({
  page: theme.page,
});

class PolicyPage extends Component {
  save = (policy) => {
    if (!policy.uuid && policy.stage === POLICY_STAGE_NEW) {
      this.props.createPolicy(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "CreatePolicy.mutationLabel",
          { policy: policyLabel(this.props.modulesManager, policy) }
        )
      );
    } else if (!policy.uuid && policy.stage === POLICY_STAGE_RENEW) {
      this.props.renewPolicy(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "RenewPolicy.mutationLabel",
          { policy: policyLabel(this.props.modulesManager, policy) }
        )
      );
    } else {
      this.props.updatePolicy(
        this.props.modulesManager,
        policy,
        formatMessageWithValues(
          this.props.intl,
          "policy",
          "UpdatePolicy.mutationLabel",
          { policy: policyLabel(this.props.modulesManager, policy) }
        )
      );
    }
  };

  render() {
    const { classes, policy_uuid, family_uuid, renew, modulesManager } = this.props;
    return (
      <div className={classes.page}>
        <PolicyForm
          key={`${policy_uuid}-${family_uuid}`}
          policy_uuid={policy_uuid !== "_NEW_" ? policy_uuid : null}
          family_uuid={family_uuid}
          back={(e) =>
            historyPush(modulesManager, history, "policy.route.policies")
          }
          save={this.save}
          renew={renew}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  policy_uuid: props.match.params.policy_uuid,
  family_uuid: props.match.params.family_uuid,
  renew: props.match.params.renew,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { createPolicy, renewPolicy, updatePolicy },
    dispatch
  );
};

export default injectIntl(
  withModulesManager(
    withHistory(
      connect(
        mapStateToProps,
        mapDispatchToProps
      )(withTheme(withStyles(styles)(PolicyPage)))
    )
  )
);

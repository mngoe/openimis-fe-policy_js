import React, { Component } from "react";
import { connect } from "react-redux";
import clsx from "clsx";
import { bindActionCreators } from "redux";
import { InputAdornment, Box, CircularProgress } from "@material-ui/core";
import { withModulesManager, TextInput, formatMessage, formatMessageWithValues } from "@openimis/fe-core";
import CheckOutlinedIcon from "@material-ui/icons/CheckOutlined";
import { injectIntl } from "react-intl";
import ErrorOutlineOutlinedIcon from "@material-ui/icons/ErrorOutlineOutlined";

import { fetchPolicyNumber } from "../actions";
import _debounce from "lodash/debounce";

const INIT_STATE = {
  search: null,
  selected: null,
};

class PolicyNumberInput extends Component {
  state = INIT_STATE;

  constructor(props) {
    super(props);
    //this.chfIdMaxLength = props.modulesManager.getConf("fe-insuree", "insureeForm.chfIdMaxLength", 12);
    this.minChequeNumber = props.modulesManager.getConf("fe-policy","minChequeNumberRequired", 6);
  }

  componentDidMount() {
    if (this.props.value) {
      this.setState((state, props) => ({
        search: !!props.value ? props.value : null,
        selected: props.value,
      }));
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.reset !== this.props.reset) {
      this.setState((state, props) => ({
        ...INIT_STATE,
        search: !!props.value ? props.value : null,
        selected: props.value,
      }));
    } else if (!_.isEqual(prevProps.policyNumber, this.props.policyNumber)) {
      this.props.onChange(this.props.policyNumber);
    } else if (!_.isEqual(prevProps.value, this.props.value)) {
      if(!!this.props.value){
        this.setState((state, props) => ({
          search: props.value.chequeImportLineCode,
          selected: props.value,
        }));
      }
    }
  }

  fetch = (policyNumber) => {
    this.setState(
      {
        search: policyNumber,
        selected: null,
      }
    );
    if(!!policyNumber && policyNumber.length >= this.minChequeNumber){
      this.props.fetchPolicyNumber(this.props.modulesManager, policyNumber)
    }
  };

  debouncedSearch = _debounce(this.fetch, this.props.modulesManager.getConf("fe-insuree", "debounceTime", 800));

  render() {
    const { intl, readOnly, required, error, policyNumber, fetching, withLabel, label} = this.props;
    const isInvalid = !!this.state.search && this.state.search.length < this.minChequeNumber;
    const isNotExit = !fetching && policyNumber === undefined;
    const status = !fetching && !!policyNumber && policyNumber.chequeImportLineStatus;
    
    return (
      <TextInput
        readOnly={readOnly}
        autoFocus={true}
        module="policy"
        label={withLabel == false ? '' : "policy.PolicyNumber"}
        value={this.state.search}
        onChange={(v) => this.debouncedSearch(v)}
        required={required}
        error={
          isInvalid ?
          formatMessageWithValues(this.props.intl, "policy", "minChequeNumberRequired", {minChequeNumber: this.minChequeNumber}):
          isNotExit ?  
          formatMessage(this.props.intl, "policy", "PolicyNumberInput.error"): 
          !!status && status.toLowerCase()=="used" ? 
          formatMessage(intl, "policy", "PolicyNumberInput.invalid") : 
          !!status && status.toLowerCase()=="cancel"? 
          formatMessage(intl, "policy", "PolicyNumberInput.cancel")  :
          null
        }        
        endAdornment={
          <InputAdornment position="end">
            <>
              {fetching && (
                <Box mr={1}>
                  <CircularProgress size={20} />
                </Box>
              )}
              {!!policyNumber && policyNumber.chequeImportLineStatus === "new" && <CheckOutlinedIcon size={20} />}
              {!!policyNumber && policyNumber.chequeImportLineStatus === "used" && <ErrorOutlineOutlinedIcon size={20} />}
              {policyNumber === undefined && <ErrorOutlineOutlinedIcon size={20} />}
            </>
          </InputAdornment>
        }
      />
    );
  }
}

const mapStateToProps = (state, props) => ({
  fetching: state.policy.fetchingPolicyNumber,
  error: state.policy.errorPolicyNumber,
  policyNumber: state.policy.policyNumber,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ fetchPolicyNumber }, dispatch);
};

export default withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(PolicyNumberInput)));

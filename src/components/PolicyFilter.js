import React, { Component } from "react";
import _debounce from "lodash/debounce";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import { Checkbox, FormControlLabel, Grid } from "@material-ui/core";
import {
  withModulesManager,
  formatMessage,
  decodeId,
  Contributions,
  PublishedComponent,
  ControlledField,
  AmountInput,
  TextInput
} from "@openimis/fe-core";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
  paperDivider: theme.paper.divider,
});

const POLICY_FILTER_CONTRIBUTION_KEY = "policy.Filter";

class PolicyFilter extends Component {
  componentDidUpdate(prevProps, prevState, snapshot) {
    document.addEventListener('keydown', this.props.handleEnter)
    if (
      prevProps.filters["showHistory"] !== this.props.filters["showHistory"] &&
      !!this.props.filters["showHistory"] &&
      this.state.showHistory !== this.props.filters["showHistory"]["value"]
    ) {
      this.setState((sate, props) => ({ showHistory: props.filters["showHistory"]["value"] }));
    }
  }
  debouncedOnChangeFilter = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf("fe-policy", "debounceTime", 200)
  );

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _onChangeCheckbox = (key, value) => {
    let filters = [
      {
        id: key,
        value: value,
        filter: `${key}: ${value}`,
      },
    ];
    this.props.onChangeFilters(filters);
  };

  _onChangeCoarseLocation = (i, v, s) => {
    let filters = [
      {
        id: `location_${i}`,
        value: v,
        filter: !v
          ? null
          : `${i === 0 ? "regionId" : "districtId"}: ${decodeId(v.id)}`,
      },
    ];
    if (!v && i === 0) {
      filters.push({
        id: `location_1`,
        value: null,
        filter: null,
      });
    }
    if (!!v && i === 1) {
      filters.push({
        id: `location_0`,
        value: v.parent,
        filter: `regionId : ${decodeId(v.parent.id)}`,
      });
    }
    this.props.onChangeFilters(filters);
  };

  _onChangeRef = (k, v, s) => {
    let filters = [
      {
        id: k,
        value: v,
        filter: !v ? null : `${k}_Id: "${v.id}"`,
      },
    ];
    this.props.onChangeFilters(filters);
  };

  render() {
    const { intl, classes, filters, onChangeFilters } = this.props;
    return (
      <Grid container className={classes.form}>
        <ControlledField
          module="policy"
          id="PolicyFilter.location"
          field={
            <Grid item xs={6}>
              <PublishedComponent
                pubRef="location.CoarseLocationFilter"
                withNull={true}
                filters={filters}
                onChange={this._onChangeCoarseLocation}
                anchor="location"
              />
            </Grid>
          }
        />
        <ControlledField
          module="policy"
          id="PolicyFilter.product"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="product.ProductPicker"
                withNull={true}
                value={this._filterValue("product")}
                onChange={(v, s) => this._onChangeRef("product", v, s)}
                withLabel
                label={formatMessage(
                  intl,
                  "policy",
                  "PolicyFilter.product.label"
                )}
                withPlaceholder
                placeholder={formatMessage(
                  intl,
                  "policy",
                  "PolicyFilter.product.placeholder"
                )}
              />
            </Grid>
          }
        />
        <ControlledField
          module="policy"
          id="PolicyFilter.officer"
          field={
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="policy.PolicyOfficerPicker"
                withNull={true}
                filters={filters}
                value={this._filterValue("officer")}
                onChange={(v, s) => this._onChangeRef("officer", v, s)}
                withLabel
                label={formatMessage(
                  intl,
                  "policy",
                  "PolicyOfficerPicker.label"
                )}
                withPlaceholder
                placeholder={formatMessage(
                  intl,
                  "policy",
                  "PolicyOfficerPicker.placeholder"
                )}
              />
            </Grid>
          }
        />
        <ControlledField
          module="policy"
          id="PolicyFilter.policyNumber"
          field={
            <Grid item xs={2} className={classes.item}>
              <TextInput
                module="policy"
                label="policy.PolicyNumber"
                name="policyNumber"
                value={this._filterValue("policyNumber")}
                onChange={(v) =>
                  this.debouncedOnChangeFilter([
                    {
                      id: "policyNumber",
                      value: v,
                      filter: `policyNumber_Icontains: "${v}"`,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        {["enroll", "start", "effective", "expiry"].map((date) => (
          <ControlledField
            module="policy"
            id={`PolicyFilter.${date}Date`}
            key={`PolicyFilter.${date}Date`}
            field={
              <Grid item xs={3}>
                <Grid container>
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={
                        (filters[`${date}DateFrom`] &&
                          filters[`${date}DateFrom`]["value"]) ||
                        null
                      }
                      module="policy"
                      label={`PolicyFilter.${date}DateFrom`}
                      onChange={(d) =>
                        onChangeFilters([
                          {
                            id: `${date}DateFrom`,
                            value: d,
                            filter: !!d ? `${date}Date_Gte: "${d}"` : null,
                          },
                        ])
                      }
                    />
                  </Grid>
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={
                        (filters[`${date}DateTo`] &&
                          filters[`${date}DateTo`]["value"]) ||
                        null
                      }
                      module="policy"
                      label={`PolicyFilter.${date}DateTo`}
                      onChange={(d) =>
                        onChangeFilters([
                          {
                            id: `${date}DateTo`,
                            value: d,
                            filter: !!d ? `${date}Date_Lte: "${d}"` : null,
                          },
                        ])
                      }
                    />
                  </Grid>
                </Grid>
              </Grid>
            }
          />
        ))}
        <ControlledField
          module="policy"
          id="PolicyFilter.type"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="policy.PolicyStagePicker"
                withNull={true}
                value={this._filterValue("stage")}
                onChange={(s) =>
                  onChangeFilters([
                    {
                      id: "stage",
                      value: s,
                      filter: !!s ? `stage: "${s}"` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        <ControlledField
          module="policy"
          id="PolicyFilter.status"
          field={
            <Grid item xs={2} className={classes.item}>
              <PublishedComponent
                pubRef="policy.PolicyStatusPicker"
                withNull={true}
                value={this._filterValue("status")}
                onChange={(s) =>
                  onChangeFilters([
                    {
                      id: "status",
                      value: s,
                      filter: !!s ? `status: ${s}` : null,
                    },
                  ])
                }
              />
            </Grid>
          }
        />
        {["balanceLte", "balanceGte"].map((b) => (
          <ControlledField
            module="policy"
            id="PolicyFilter.balanceUnder"
            key={b}
            field={
              <Grid item xs={2} className={classes.item}>
                <AmountInput
                  module="policy"
                  label={`PolicyFilter.${b}`}
                  value={filters[b] && filters[b]["value"]}
                  onChange={(v) =>
                    this.debouncedOnChangeFilter([
                      {
                        id: b,
                        value: !v ? null : v,
                        filter: !!v ? `${b}: ${v}` : null,
                      },
                    ])
                  }
                />
              </Grid>
            }
          />
        ))}
        <ControlledField
          module="policy"
          id="PolicyFilter.showInactive"
          field={
            <Grid item xs={2} className={classes.item}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!this._filterValue("showInactive")}
                    onChange={(event) =>
                      this._onChangeCheckbox(
                        "showInactive",
                        event.target.checked
                      )
                    }
                  />
                }
                label={formatMessage(
                  intl,
                  "policy",
                  "PolicyFilter.showInactive"
                )}
              />
            </Grid>
          }
        />
        <ControlledField
          module="policy"
          id="PolicyFilter.showHistory"
          field={
            <Grid item xs={2} className={classes.item}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={!!this._filterValue("showHistory")}
                    onChange={(event) =>
                      this._onChangeCheckbox(
                        "showHistory",
                        event.target.checked
                      )
                    }
                  />
                }
                label={formatMessage(
                  intl,
                  "policy",
                  "PolicyFilter.showHistory"
                )}
              />
            </Grid>
          }
        />
        <Contributions
          filters={filters}
          onChangeFilters={onChangeFilters}
          contributionKey={POLICY_FILTER_CONTRIBUTION_KEY}
        />
      </Grid>
    );
  }
}

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(PolicyFilter)))
);

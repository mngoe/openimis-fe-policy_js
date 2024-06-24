import React, { useEffect, useState } from "react";
import { Autocomplete, useModulesManager, useTranslations } from "@openimis/fe-core";
import { useContributionPlanQuery } from "../hooks";
import _debounce from "lodash/debounce";

const PolicyContributionPlanPicker = (props) => {
  const {
    multiple,
    required,
    placeholder,
    label,
    withLabel,
    withPlaceholder,
    readOnly,
    value,
    onChange,
    filter,
    filterSelectedOptions,
    locationId,
  } = props;
  const modulesManager = useModulesManager();
  const [filters, setFilters] = useState({ location: locationId });
  const { formatMessage } = useTranslations("product", modulesManager);
  const { isLoading, error, data } = useContributionPlanQuery({ filters }, { skip: true });

  const onOpen = () => {
    setFilters({ first: 15, location: locationId });
  };
  return (
    <Autocomplete
      multiple={multiple}
      required={required}
      error={error}
      placeholder={placeholder ?? formatMessage("ProductPicker.placeholder")}
      label={label ?? formatMessage("Product")}
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      options={ !!data.contributionPlans ? data.contributionPlans : [] }
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) => `${option.code} ${option.name}`}
      onChange={(value) => onChange(value, value ? `${value.code} ${value.name}` : null)}
      onOpen={onOpen}
      filterOptions={filter}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(search) => setFilters({ first: 15, search, location: locationId })}
    />
  );
};

export default PolicyContributionPlanPicker;

import React, { useState } from "react";

import { TextField } from "@material-ui/core";

import {
  useTranslations,
  Autocomplete,
  useGraphqlQuery,
} from "@openimis/fe-core";

const PolicyOfficerPicker = (props) => {
  const {
    onChange,
    readOnly,
    required,
    withLabel = false,
    withPlaceholder = false,
    value,
    label,
    filterOptions,
    filterSelectedOptions,
    placeholder,
    extraFragment,
    nullLabel,
    multiple,
    filters,
    villageId,
  } = props;
  const [searchString, setSearchString] = useState(null);
  const { formatMessage } = useTranslations("policy");

  let distinctId = null;
  let regionId = null;
  if (filters?.location_0?.filter) {
    if (filters?.location_0?.filter)
      distinctId = filters?.location_0?.filter.replace(/^\D+/g, "");
    if (filters?.location_1?.filter)
      regionId = filters?.location_1?.filter.replace(/^\D+/g, "");
  } else {
    distinctId = villageId;
  }

  const { isLoading, data, error } = useGraphqlQuery(
    `query PolicyOfficerPicker ($searchString: String, $first: Int) {
      policyOfficers(search: $searchString, first: $first) {
        edges {
          node {
            id
            uuid
            code
            lastName
            otherNames
            ${extraFragment ?? ""}
          }
        }
      }
    }`,
    { searchString, first: 20, district: distinctId, region: regionId },
    { skip: true }
  );

  return (
    <Autocomplete
      multiple={multiple}
      error={error}
      readOnly={readOnly}
      options={data?.policyOfficers?.edges.map((edge) => edge.node) ?? []}
      isLoading={isLoading}
      value={value}
      getOptionLabel={(option) =>
        `${option.code} ${option.lastName} ${option.otherNames}`
      }
      onChange={(option) =>
        onChange(
          option,
          option
            ? `${option.code} ${option.lastName} ${option.otherNames}`
            : null
        )
      }
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={setSearchString}
      renderInput={(inputProps) => (
        <TextField
          {...inputProps}
          required={required}
          label={
            (withLabel && (label || nullLabel)) ||
            formatMessage("PolicyOfficerPicker.label")
          }
          placeholder={
            (withPlaceholder && placeholder) ||
            formatMessage("PolicyOfficerPicker.placeholder")
          }
        />
      )}
    />
  );
};

export default PolicyOfficerPicker;

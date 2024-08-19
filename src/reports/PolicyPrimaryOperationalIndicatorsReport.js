import { Grid } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const InsureeMissingPhotoReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("policy", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.yearMonth}
          module="policy"
          required
          label="PrimaryOperationalIndicatorsReport.yearMonth"
          onChange={(yearMonth) => setValues({ ...values, yearMonth })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.LocationPicker"
          onChange={(location) =>
            setValues({
              ...values,
              location,
            })
          }
          value={values.location}
          locationLevel={1}
        />
      </Grid>
    </Grid>
  );
};

export default InsureeMissingPhotoReport;

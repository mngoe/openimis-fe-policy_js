import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { PREGNANCY_AGE } from "../constants";

class PregnancyAgePicker extends Component {
  render() {
    return <ConstantBasedPicker module="policy" onlyConstants={true} constants={PREGNANCY_AGE} {...this.props} />;
  }
}

export default PregnancyAgePicker;
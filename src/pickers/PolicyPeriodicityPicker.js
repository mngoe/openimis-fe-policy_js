import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { PERIODICITY_VALUES } from "../constants";

class PolicyPeriodicityPicker extends Component {

    render() {
        const { contributionPlan } = this.props;

        // Logique de filtrage sans modifier la constante d'origine
        const isAmos = !!contributionPlan && ['AMOS1', 'AMOS2', 'AMOS3', 'AMOS4'].includes(contributionPlan.code);
        const isAms = !!contributionPlan && contributionPlan.code === "AMS";
        const filteredPeriodicity = isAmos
            ? PERIODICITY_VALUES.filter(p => p !== "M")
            : isAms ? PERIODICITY_VALUES.filter(p => p!== "M" && p!== "Q" && p!== "S") : PERIODICITY_VALUES
        return (
            <ConstantBasedPicker
                module="policy"
                label="Periodicity"
                constants={filteredPeriodicity}
                value={filteredPeriodicity[0]}
                {...this.props}
            />
        );
    }
}

export default PolicyPeriodicityPicker;
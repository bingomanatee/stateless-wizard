import React from "react";
import VeContext from "./veContext";
import WizardController from "./WizardController";
import Stage from "./Stage";
import ValidationEngine from "./ValidationEngine";
import Framework from "./Framework";
import Action from "./Action";
import Subject from "./Subject";
import Done from "./Done";

export default () => (
  <VeContext.Provider
    value={
      new ValidationEngine("wizard", {
        sections: [],
        labels: [],
        currentSection: 0
      })
    }
  >
    <WizardController>
      <Stage order={0} label="Choose Legal Framework" title="Legal Framework">
        <Framework order={0} />
      </Stage>
      <Stage
        order={1}
        label="Choose %framework% Privacy Right"
        title="step Two"
      >
        <Action order={1} />
      </Stage>
      <Stage
        order={2}
        label="Confirm Data Subject Email Address"
        title="Subject"
      >
        <Subject order={2} />
      </Stage>
      <Stage order={3} label="Done" title="Done">
        <Done order={3} />
      </Stage>
    </WizardController>
  </VeContext.Provider>
);

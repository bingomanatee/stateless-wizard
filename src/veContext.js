import React from "react";
import ValidationEngine from "./ValidationEngine";

export default React.createContext(
  new ValidationEngine("wizard", {
    steps: [],
    currentStep: 0
  })
);

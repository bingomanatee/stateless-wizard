import React, { useContext, useState, useEffect, version } from "react";
import veContext from "./veContext";
import subscribeToSubject from "./subscribeToSubject";
import lGet from "lodash/get";
import styled from "styled-components";

const StyleFrame = styled.section`
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
`;

export default ({ title, label, order, children }) => {
  const ve = useContext(veContext);
  const [currentStage, setCurrentStage] = useState(0);
  const [currentLabel, setCurrentLabel] = useState('');

  subscribeToSubject(
    () => ve,
    ({ data, meta, errors }) => {
      const { currentSection: cs, sections, labels } = data;
     
      if (cs !== currentStage) {
        setCurrentStage(cs);
      }
      if (lGet(sections, order) !== title) {
        const newStages = [...sections];
        newStages[order] = title;
        ve.set("sections", newStages);
      }

      if (lGet(labels, order) !== label) {
        const newLabels = [...labels];
        newLabels[order] = label;
        ve.set("labels", newLabels);
      }

      if (meta.currentLabel !== currentLabel) {
        setCurrentLabel(meta.currentLabel || '');
      }
    }
  );

  if (!ve) {
    return <></>;
  }

  if (currentStage === order) {
    return (
      <StyleFrame>
        <h2>{currentLabel}</h2>
        <div>{children}</div>
      </StyleFrame>
    );
  }

  return <div className="hidden">{children}</div>;
};

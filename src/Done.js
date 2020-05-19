import React, { useContext, useState, useEffect } from "react";
import veContext from "./veContext";
import subscribeToSubject from "./subscribeToSubject";
import lGet from "lodash/get";
import isEqual from "lodash/isEqual";

const CCPAactions = [
  { value: "download", title: "Access(Download)" },
  { value: "access categories", title: "Access Categories" },
  { value: "deletion", title: "Deletion" }
];
const GDAActions = [
  { value: "download", title: "Access(Download)" },
  { value: "deletion", title: "Deletion" }
];

export default ({ order, children }) => {
  const ve = useContext(veContext);
  const [currentSection, setCurrentSection] = useState(0);
  const [action, setAction] = useState(null);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    if (!ve || ve.meta.doneInitialized) {
      return;
    }
    console.log("initializing done");
    ve.setMeta("doneInitialized", true);

    ve.addTest(({ currentSection }) => {
      return currentSection < 2 && "action is not selected";
    }, "section2:selected");
  }, [ve]);

  subscribeToSubject(
    () => ve,
    ({ data: ds, meta: ms, errors: es }) => {
      const dSection = lGet(ds, "currentSection", 0);

      if (currentSection !== dSection) {
        setCurrentSection(dSection);
      }
    }
  );

  if (!ve) {
    return "";
  }

  if (currentSection === order) {
    return (
      <div>
        <p>Wizard Done</p>
      </div>
    );
  }

  return "";
};

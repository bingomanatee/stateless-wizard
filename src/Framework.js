import React, { useContext, useState, useEffect } from "react";
import veContext from "./veContext";
import subscribeToSubject from "./subscribeToSubject";
import lGet from "lodash/get";
import isEqual from "lodash/isEqual";

const reflectFrameworkState = (data, meta, ve) => {
  ve.setMeta("frameworkSelected", !!data.framework);
};

export default ({ order, children }) => {
  const ve = useContext(veContext);
  const [currentSection, setCurrentSection] = useState(0);
  const [meta, setMeta] = useState(null);
  const [frameworks, setFrameworks] = useState([]);

  useEffect(() => {
    if (!ve || ve.meta.frameworkInitialized) {
      return;
    }
    console.log("initializing framework");
    ve.setMeta("frameworkInitialized", true);

    if (!lGet(ve, "data.framework")) {
      ve.set("framework", null);
      ve.setMeta("frameworks", [
        { value: "ccpa", title: "CCPA" },
        { value: "gda", title: "GDA" },
        { title: "Spam", value: "spam" }
      ]);
    }

    ve.addListener(reflectFrameworkState);

    ve.addTest(({ framework }, { frameworkSelected }) => {
      return !frameworkSelected && "framework is not selected";
    }, "section0:selected");
  }, [ve]);

  subscribeToSubject(
    () => ve,
    ({ data, meta, errors }) => {
      const { framework: cFramework } = data;
      if (cFramework !== meta) {
        setMeta(cFramework);
      }
      if (!isEqual(meta.frameworks, frameworks)) {
        setFrameworks(meta.frameworks);
      }
      if (currentSection !== data.currentSection) {
        setCurrentSection(data.currentSection);
      }
    }
  );

  if (!ve) {
    return "";
  }

  if (currentSection === order) {
    return (
      <>
        {frameworks.map(({ value, title }) => {
          return (
            <div>
              <label>
                <input
                  type="radio"
                  onChange={() => ve.set("framework", value)}
                  checked={value === meta}
                  value={value}
                />{" "}
                {title}
              </label>
            </div>
          );
        })}
      </>
    );
  }

  return "";
};

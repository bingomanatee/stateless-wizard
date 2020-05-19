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

const reflectFrameworkState = (data, meta, ve) => {
  let actions = CCPAactions;

  switch (data.framework) {
    case "ccpa":
      actions = CCPAactions;
      break;

    case "gda":
      actions = GDAActions;
      break;

    default:
      actions = [];
  }

  if (!isEqual(meta.actions, actions)) {
    ve.setMeta("actions", actions);
  }
};

const reflectActionState = (data, meta, ve) => {
  const hasAction = !!lGet(data, "action");
  ve.setMeta("actionSelected", hasAction);
};

export default ({ order, children }) => {
  const ve = useContext(veContext);
  const [currentSection, setCurrentSection] = useState(0);
  const [action, setAction] = useState(null);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    if (!ve || ve.meta.actionInitialized) {
      return;
    }
    console.log("initializing action");
    ve.setMeta("actionInitialized", true);

    if (!lGet(ve, "meta.actions")) {
      ve.setMeta("actions", []);
    }
    if (typeof ve.data.action === "undefined") {
      ve.set("action", null);
    }

    ve.addListener(reflectFrameworkState);
    ve.addListener(reflectActionState);

    ve.addTest(({ action }, { actionSelected }) => {
      const rValue = !actionSelected && "action is not selected";
      return rValue;
    }, "section1:selected");
  }, [ve]);

  subscribeToSubject(
    () => ve,
    ({ data: ds, meta: ms, errors: es }) => {
      const dSection = lGet(ds, "currentSection", 0);

      if (currentSection !== dSection) {
        setCurrentSection(dSection);
      }

      if (!isEqual(actions, ms.actions)) {
        setActions(lGet(ms, "actions", []));
      }

      if (!isEqual(ds.action, action)) {
        setAction(ds.action);
      }

      // if the current set of actions don't nave a value equal to the current action
      // reset it to null
      if (ds.action) {
        const actions = lGet(ms, "actions", []);
        if (!actions.find(({ value }) => value === ds.action)) {
          ve.set("action", null);
        }
      }
    }
  );

  if (!ve) {
    return "";
  }

  if (currentSection === order) {
    return (
      <>
        {actions.map(({ value, title }) => {
          return (
            <div>
              <label>
                <input
                  type="radio"
                  onChange={() => ve.set("action", value)}
                  checked={value === action}
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

import React, { useContext, useState, useEffect } from "react";
import veContext from "./veContext";
import subscribeToSubject from "./subscribeToSubject";
import lGet from "lodash/get";
import isEqual from "lodash/isEqual";

const noMailTest = subject => !subject && "You must provide subject email";
const badMailTest = subject =>
  subject &&
  typeof subject === "string" &&
  !/.+@.+\..+/.test(subject) &&
  "you must provide a proper email";

export default ({ order }) => {
  const ve = useContext(veContext);
  const [currentSection, setCurrentSection] = useState(0);
  const [subject, setSubject] = useState("");

  useEffect(() => {
    if (!ve || ve.meta.emailInitialized) {
      return;
    }
    console.log("initializing email");
    ve.setMeta("emailInitialized", true);
    ve.set("subject", "");
    ve.addTest(["subject", noMailTest], "section2:noMail");
    ve.addTest(["subject", badMailTest], "section2.badEmail");
  }, [ve]);

  subscribeToSubject(
    () => ve,
    ({ data, meta, errors }) => {
      if (currentSection !== data.currentSection) {
        setCurrentSection(data.currentSection);
      }
    }
  );

  if (!ve) {
    return "";
  }

  const changeSubject = ({ target }) => {
    const value = lGet(target, "value", "");
    setSubject(value);
    if (ve) ve.set("subject", value);
  };

  if (currentSection === order) {
    return (
      <div>
        <label>Email</label>
        <input value={subject} onChange={changeSubject} name="email" />
      </div>
    );
  }

  return "";
};

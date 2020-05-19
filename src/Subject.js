import React, { useContext, useState, useEffect } from "react";
import veContext from "./veContext";
import subscribeToSubject from "./subscribeToSubject";
import lGet from "lodash/get";
import isEqual from "lodash/isEqual";
import Errors from "./Errors";

const MAIL_RE = /.+@.+\..+/;
const noMailTest = subject => !subject && "You must provide subject email";
const badMailTest = subject =>
  subject &&
  typeof subject === "string" &&
  !MAIL_RE.test(subject) &&
  "you must provide a proper email";

const noRecipTest = ({ recipient, useRecipient }) => {
  return useRecipient && !recipient && "you must specifiy a recipient";
};

const badRecipTest = ({ recipient, useRecipient }) => {
  if (!useRecipient) return false;
  if (!(recipient && typeof recipient === "string")) {
    return false;
  }
  return (
    !MAIL_RE.test(recipient) &&
    "You must provide a properly formatted recipeint"
  );
};
const dupeRecipient = ({ recipient, subject, useRecipient }) => {
  return (
    useRecipient &&
    recipient &&
    recipient === subject &&
    "Recipieint must be different than subject"
  );
};

export default ({ order }) => {
  const ve = useContext(veContext);
  const [currentSection, setCurrentSection] = useState(0);
  const [subject, setSubject] = useState("");
  const [useRecipient, setUseRecipient] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!ve || ve.meta.emailInitialized) {
      return;
    }
    console.log("initializing email");
    ve.setMeta("emailInitialized", true);
    ve.setMeta("useRecipient", false);
    ve.set("recipient", "");
    ve.set("subject", "");
    ve.addTest(["subject", noMailTest], "section2:subjectMissing");
    ve.addTest(["subject", badMailTest], "section2:subjectBad");
    ve.addTest(noRecipTest, "section2:recipientBad");
    ve.addTest(badRecipTest, "section2:recipientAbsent");
    ve.addTest(dupeRecipient, "section2:recipientDupe");
  }, [ve]);

  subscribeToSubject(
    () => ve,
    ({ data, meta, errors: es }) => {
      if (currentSection !== data.currentSection) {
        setCurrentSection(data.currentSection);
      }
      setErrors(es);
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

  const changeUseRecipeint = ({ target }) => {
    const value = !!lGet(target, "checked", false);
    setUseRecipient(value);
    if (ve) ve.set("useRecipient", value);
  };

  const changeRecipeint = ({ target }) => {
    const value = lGet(target, "value", false);
    setRecipient(value);
    if (ve) ve.set("recipient", value);
  };

  if (currentSection === order) {
    return (
      <div>
        <div>
          <label>Email</label>
          <input value={subject} onChange={changeSubject} name="email" />
          <Errors test="section2:subject" errors={errors} />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              value={useRecipient}
              onChange={changeUseRecipeint}
            />
            Use Recipient
          </label>{" "}
        </div>
        {useRecipient && (
          <div>
            <label>Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={changeRecipeint}
              name="email"
            />
            <Errors test="section2:recipient" errors={errors} />
          </div>
        )}
      </div>
    );
  }

  return "";
};

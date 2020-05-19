import React, { useState, useEffect, useContext } from "react";
import veContext from "./veContext";
import subscribeToSubject from "./subscribeToSubject";
import Timeline from "./Timeline";
import styled from "styled-components";
import isEqual from "lodash/isEqual";
import lGet from "lodash/get";

const Button = styled.button`
  -webkit-appearance: none;
  border-radius: 0.25rem;
  border: none;
  padding: 0.35rem;
  background-color: ${({ disabled }) => (disabled ? "lightGrey" : "darkBlue")};
  color: ${({ disabled }) => (disabled ? "black" : "white")};
`;

const Feedback = styled.section`
  padding: 1rem;
  background-color: rgb(20, 51, 30);
  color: grey;
  margin-top: 1rem;
  max-height: 50vh;
  overflow-y: auto;
  font-family: Monaco, "Courier New", Courier, monospace;
  font-size: 0.75em;
  display: grid;
  grid-template-columns: 2fr 3fr 3fr;
  overflow-y: scroll;

  table {
    border: 1px solid green;
    tr: {
      padding: 0;
      margin: 0;
    }
    td,
    th {
      text-align: left;
      padding: 3px;
      border-bottom: 1px solid green;
    }

    th {
      color: white;
      font-weight: normal;
      text-align: right;
    }
  }
`;

const ContentFrame = styled.main`
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0.3rem;
  button {
    min-width: 33%;
  }
`;

const j = value => {
  if (!(value && typeof value === "object")) {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (err) {
    return value;
  }
};

const Data = ({ data }) => {
  if (!(data && typeof data === "object")) {
    return "";
  }
  return (
    <table>
      {Object.keys(data).map(key => {
        return (
          <tr>
            <th>{key}</th>
            <td>{j(data[key])}</td>
          </tr>
        );
      })}
    </table>
  );
};

function setCurrentLabel(data, meta, ve) {
  const { currentSection, labels, framework } = data;
  let { frameworks } = meta;
  if (!Array.isArray(frameworks)) frameworks = [];
  const currentFramework = frameworks.find(({ value }) => value === framework);
  const frameworkTitle = lGet(currentFramework, "title", "Framework");
  let currentLabel = labels[currentSection] || "";
  currentLabel = currentLabel.replace("%framework%", frameworkTitle);
  ve.setMeta("currentLabel", currentLabel);
}

export default props => {
  const ve = useContext(veContext);
  const [data, setData] = useState({});
  const [errors, setErrors] = useState([]);
  const [meta, setMeta] = useState({});
  const [canContinue, setCanContinue] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [sections, setSections] = useState([]);

  subscribeToSubject(
    () => ve,
    ({ data: ds, errors: es, meta: ms }) => {
      setData(ds);
      setErrors(es);
      setMeta(ms);
      setCurrentSection(ds.currentSection);
      setSections(ds.sections);

      const { currentSection } = ds;

      const nameCheck = new RegExp("^section" + currentSection);
      const currentSectionErrors = es.filter(({ name }) =>
        nameCheck.test(name)
      );
      const canContinue = !currentSectionErrors.length;

      if (canContinue !== ms.canContinue) {
        ve.setMeta("canContinue", canContinue);
      } else {
        setCanContinue(ms.canContinue);
      }
    }
  );

  if (!ve) {
    return "";
  }

  const nextSection = () => {
    ve && ve.set("currentSection", lGet(ve, "data.currentSection", 0) + 1);
  };

  useEffect(() => {
    if (!ve || ve.meta.wizardInitialized) return;

    ve.setMeta("wizardInitialized", true);

    ve.addListener(setCurrentLabel);

    ve.setMeta("canContinue", false);
  }, [ve]);

  return (
    <>
      <Timeline />
      <ContentFrame>
        <div>{props.children}</div>
        {currentSection < lGet(sections, "length", 0) ? (
          <ButtonRow>
            <Button type="button" disabled={!canContinue} onClick={nextSection}>
              Next
            </Button>
          </ButtonRow>
        ) : (
          <span>&nbsp;</span>
        )}
      </ContentFrame>

      <Feedback>
        <div>
          <h2>Errors</h2>
          <Data
            data={(errors || []).reduce((out, error) => {
              out[error.name] = error.error;
              return out;
            }, {})}
          />
        </div>

        <div>
          <h2>Data</h2>
          <Data data={data} />
        </div>
        <div>
          <h2>Meta</h2>
          <Data data={meta} />
        </div>
      </Feedback>
    </>
  );
};

import React, { useContext, useState } from "react";

import styled from "styled-components";
import subscribeToSubject from "./subscribeToSubject";
import veContext from "./veContext";
import isEqual from "lodash/isEqual";
import repeat from "lodash/repeat";

const Wrapper = styled.nav`
  display: grid;
  grid-column-gap: 1rem;
  grid-template-rows: auto;
  grid-template-columns: ${({ total }) => repeat(" 1fr ", total)};
`;

const Item = styled.div`
  background-color: ${({ order, currentSection }) =>
    order < currentSection
      ? "darkBlue"
      : order === currentSection
      ? "black"
      : "lightGrey"};
  color: ${({ order, currentSection }) =>
    order <= currentSection ? "white" : "black"};
  padding: 0.5rem;
  white-space: nowrap;
`;

export default props => {
  const ve = useContext(veContext);

  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);

  subscribeToSubject(
    () => ve,
    ({ data }) => {
      if (!isEqual(data.sections, sections)) {
        setSections(data.sections);
      }

      if (!isEqual(data.currentSection, currentSection)) {
        setCurrentSection(data.currentSection);
      }
    }
  );

  if (!ve) return "";

  return (
    <Wrapper total={sections.length}>
      {sections.map((title, order) => (
        <Item order={order} currentSection={currentSection}>
          {title}
        </Item>
      ))}
    </Wrapper>
  );
};

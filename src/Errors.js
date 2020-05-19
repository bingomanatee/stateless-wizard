import React from "react";
import styled from "styled-components";

const Error = styled.div`
  color: red;
  padding: 2px;
  font-size: 0.9em;
`;

export default ({ test, errors }) => {
  console.log("test:", test);
  console.log("errors:", errors);

  const matches = errors.filter(({ name }) => {
    const includes = name.includes(test);
    console.log(name, "includes", test, includes);
    return includes;
  });

  if (!matches.length) return "";
  return matches.map(({ error }) => {
    return <Error>{error}</Error>;
  });
};

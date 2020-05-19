import { useEffect, useState } from "react";

export default (getTarget, onChange, onError = () => {}) => {
  if (typeof onChange !== "function") {
    throw new Error("bad onChange:", onChange);
  }
  if (typeof getTarget !== "function") {
    throw new Error("bad onChange:", onChange);
  }
  if (onError && typeof onError !== "function") {
    throw new Error("bad onError:", onChange);
  }

  const [sub, setSub] = useState(null);
  useEffect(() => {
    const currentTarget = getTarget();
    if (!currentTarget) {
      if (sub) {
        sub.unsubscribe();
        setSub(null);
      }
      return;
    }

    if (sub) {
      if (sub.$target !== currentTarget) {
        sub.unsubscribe();
        const newSub = currentTarget.subscribe(onChange, onError);
        newSub.$target = currentTarget;
        setSub(newSub);
      }
    } else {
      const newSub = currentTarget.subscribe(onChange, onError);
      newSub.$target = currentTarget;
      setSub(newSub);
    }
  }, [sub]);
};

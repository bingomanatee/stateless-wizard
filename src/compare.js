import { v4 as uuidv4 } from "uuid";
import pick from "lodash/pick";
import lGet from "lodash/get";
import compact from "lodash/compact";
import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import isEqual from "lodash/isEqual";

export function snapshot(file) {
  if (!file || typeof file !== "object") {
    return "";
  }
  const standIn = pick(
    file,
    "name size $id $status $error $message".split(" ")
  );
  try {
    return JSON.stringify(standIn);
  } catch (err) {
    return "";
  }
}

export const goodFile = file => {
  if (!(file && typeof file === "object")) {
    return false;
  }
  return typeof lGet(file, "name") === "string";
};

export const snapshotFiles = files => {
  if (!Array.isArray(files)) {
    return [];
  }

  return new Set(
    compact(
      sortBy(uniq(compact(files)), ["name", "size", "$time"]).map(snapshot)
    )
  );
};

export const compareSnapshots = (a, b) => {
  return isEqual(a, b);
};

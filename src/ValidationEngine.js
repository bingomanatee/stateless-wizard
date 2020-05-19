import { BehaviorSubject, combineLatest } from "rxjs";
import { distinctUntilChanged, map, filter } from "rxjs/operators";

import isEqual from "lodash/isEqual";
import bindAll from "lodash/bindAll";
import clone from "lodash/clone";
import { v4 as uuidv4 } from "uuid";

import { compareSnapshots } from "./compare";

const ABSENT = Symbol("ABSENT");
const distinct = isEqual;

export function snapshot(item) {
  if (!item || typeof item !== "object") {
    return "";
  }
  try {
    return JSON.stringify(item);
  } catch (err) {
    return `${item}`;
  }
}

class Transaction {
  constructor(ve) {
    this.ve = ve;
    this.snapshot = ve.asSnapshot();
    this.id = uuidv4();
    this.actionStarted = false;
    this.actionFinished = false;
  }
}

const serializeVE = data => {
  try {
    return JSON.parse(JSON.serialize(data));
  } catch (err) {
    return data;
  }
};

/**
 *
 * This class contains a series of tests to determine the validity of the data;
 * this can be a single form element with multiple tests or a series of form elements.
 */
class ValidationEngine {
  constructor(name, data = ABSENT, config = {}) {
    this.id = uuidv4();
    const {
      tests = false,
      meta = {},
      listeners = [],
      distinctDataFilter = distinct,
      distinctMetaFilter = distinct,
      serialize = serializeVE
    } = config;
    this._name = name;
    this._initTests(tests);
    this._data = data === ABSENT ? null : data;
    this._listeners = new Set();
    this._serialize = serialize;
    this._meta = typeof meta === "object" ? meta : "";
    this._distinctDataFilter = distinctDataFilter;
    this._distinctMetaFilter = distinctMetaFilter;
    this._transactions = new Set();

    this._dataStream = new BehaviorSubject(this.data).pipe(
      map(data => {
        return {
          data,
          snapshot: snapshot(data)
        };
      }),
      distinctUntilChanged(compareSnapshots),
      map(({ data }) => data)
    );
    this._transactionCountStream = new BehaviorSubject(0);
    this._metaStream = new BehaviorSubject(this.meta).pipe(
      distinctUntilChanged(distinctMetaFilter)
    );
    this._errorStream = new BehaviorSubject(this.status);
    this._errorStreamWithTrans = combineLatest([
      this._errorStream,
      this._transactionCountStream
    ]).pipe(
      filter(([status, count]) => count === 0),
      map(([status]) => status)
    );

    this._initListeners(listeners);
    this._changeSubscriber = combineLatest([
      this._dataStream,
      this._metaStream
    ]).subscribe(
      ([data, meta]) => {
        this._onChange(data, meta);
      },
      err => {
        console.log("error on changeSubscriber", err);
      }
    );
    this.initialized = true;
    bindAll(this, "change,_onChange".split(","));

    this.broadcastErrorState();
  }

  change() {
    this._onChange(this.data, this.meta);
  }

  try(action) {
    const trans = new Transaction(this);
    const transSubject = new BehaviorSubject(trans);
    this.addTransaction(trans);
    const dataStream = combineLatest(this._errorStream, transSubject);
    requestAnimationFrame(() => {
      try {
        action(this, trans);
        this.removeTransaction(trans);
        dataStream.complete();
      } catch (error) {
        dataStream.error({ error, trans });
        this.removeTransaction(trans);
        dataStream.complete();
      }
    });
    return dataStream;
  }

  addTransaction(trans) {
    this._transiactions.add(trans);
    this._transactionCountStream.next(this._transactions.size);
  }

  removeTransaction(trans) {
    if (!this._transactions.has(trans)) return;
    this._transactions.remove(trans);
    this._transactionCountStream.next(this._transactions.size);
  }

  dataSnapshot() {
    return this._serialize(this.data);
  }

  /**
   * responds to update of metadata or data
   * note - in listener, only use setMeta to change state.
   * these methods are tuned to delay broadcast until a change series is completed.
   *
   * @param data
   * @param meta
   * @private
   */
  _onChange(data, meta) {
    if (this._changeRequests) {
      // any onChange triggered by listeners do not fire off immediate recalculations;
      // they do initiate SUBSEQUENT recalculations
      ++this._changeRequests;
      return;
    }

    this._changeRequests = 1;
    if (this._listeners.size) {
      this._listeners.forEach(listener => listener(data, meta, this));
    }

    if (this._changeRequests > 1) {
      // a listener initialized a change in the loop above.
      this._changeRequests = 0;
      this.change(); // restart the change reconciliation until all listeners make noop changes
      return;
      // postpone emission until all listeners are reconciled.
    }
    this._changeRequests = 0;
    this.broadcastErrorState();
  }

  _initListeners(onChange) {
    if (!onChange) {
      return;
    }
    if (typeof onChange === "function") {
      this.addListener(onChange);
    }
    if (Array.isArray(onChange)) {
      onChange.forEach(meta => this.addListener(meta));
    } else {
      throw Object.assign(
        new Error("onChange needs to be an array or function"),
        { onMeta: onChange }
      );
    }
  }

  addListener(listener) {
    if (!this._listeners.has(listener)) {
      this._listeners.add(listener);
      if (this.initialized) {
        this.change();
      }
    }
  }

  get data() {
    return this._data;
  }

  get meta() {
    if (this._pendingChanges) {
      return Object.assign({}, this._meta, this._pendingChanges);
    }
    return this._meta;
  }

  /**
   * set a field in the data - if data is structure; otherwise equivalent to next;.
   * @param key
   * @param value
   */
  set(key, value) {
    let newData;
    if (typeof this.data !== "object") {
      return;
    }
    if (this.data instanceof Map) {
      newData = new Map(this.data);
      newData.set(key, value);
    } else if (Array.isArray(this.data)) {
      newData = [...this.data];
      newData[key] = value;
    } else {
      // this is the ordinary path for set with object based data
      newData = Object.assign({}, this.data, { [key]: value });
    }
    // console.log(this.name, 'setting new data:', newData);
    this.next(newData);
  }

  setMeta(key, value) {
    const lastMeta = this.meta;
    this._meta = Object.assign({}, lastMeta, { [key]: clone(value) });
    this._metaStream.next(this.meta);
  }

  get name() {
    return this._name || "";
  }

  _initTests(tests) {
    if (typeof tests === "function") {
      tests = [tests];
    }
    this.tests = new Map();
    if (!tests) {
      return;
    }
    if (tests instanceof Map || Array.isArray(tests)) {
      tests.forEach((test, index) => {
        if (typeof index === "number") {
          while (!index || this.tests.has(index)) ++index;
        }
        this.addTest(test, index);
      });
    } else if (tests && typeof tests === "object") {
      Object.keys(tests).forEach(key => {
        this.addTest(tests[key], key);
      });
    }
  }

  addTest(test, name) {
    if (!(test && name)) {
      return;
    }

    if (this.tests.get(name) !== test) {
      this.tests.set(name, test);
      if (this.initialized) {
        this.change();
      }
    }
  }

  subscribe(...args) {
    try {
      return this._errorStreamWithTrans.subscribe(...args);
    } catch (err) {
      console.log("bad subscription", err, args);
    }
  }

  next(data) {
    this._data = data;
    this._dataStream.next(data);
  }

  _filter(filter, data, errors) {
    let filteredData = data;
    if (typeof filter === "string" || typeof filter === "number") {
      if (data instanceof Map) {
        filteredData = data.get(filter);
      } else if (typeof data === "object") {
        filteredData = data[filter];
      } else {
        throw new Object.assign(
          Error("bad filter in test " + name + "in VE " + this.name),
          { filter }
        );
      }
    } else if (typeof filter === "function") {
      filteredData = filter(data, errors);
    } else {
      throw new Object.assign(
        Error("bad filter in test " + name + "in VE " + this.name),
        { filter }
      );
    }
    return filteredData;
  }

  _perform(test, name, errors) {
    let error = false;
    let data = this.data;
    if (Array.isArray(test)) {
      const [filter, evaluator] = test;
      const filteredData = this._filter(filter, data, errors);
      error = evaluator(filteredData, this.meta, errors, name);
    } else if (typeof test === "function") {
      error = test(this.data, this.meta, errors, name);
    }
    // else throw ?
    return error;
  }

  get status() {
    const errors = [];
    this.tests.forEach((test, name) => {
      let error = this._perform(test, name, errors);
      if (error) {
        errors.push({ error, name });
      }
    });
    return {
      name: this.name,
      errors,
      data: this.data,
      meta: this.meta,
      valid: !errors.length
    };
  }

  /**
   * update listeners with the status of validation;
   * ordinarily should be an internal method but mught be useful
   * if you have altered the tests or extractors.
   */
  broadcastErrorState() {
    this._errorStream.next(this.status);
  }

  complete() {
    this._dataStream.complete();
    this._metaStream.complete();
    this._changeSubscriber.complete();
  }

  /**
   * allows this validator to be chained into another validator as a test
   * @param extractor {}
   * @returns {function}
   */

  asTest(filterErrors) {
    return data => {
      this.next(data);
      const { errors, valid } = this.status;
      if (valid) {
        return false;
      }
      if (typeof filterErrors === "function") {
        return filterErrors(errors);
      }
      return errors;
    };
  }
}

export default ValidationEngine;

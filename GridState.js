import { uuid, isEmpty } from './utils.js';

class TransientGridState {
  constructor() {
    this._lastMouseDown;
    this._lastMouseOver;
    this._currentSlotMarker;
  }
  get lastMouseDown() {
    return this._lastMouseDown;
  }
  get lastMouseOver() {
    return this._lastMouseOver;
  }
  get currentSlotMarker() {
    return this._currentSlotMarker;
  }
  set lastMouseDown(val) {
    this.reset();
    this._lastMouseDown = val;
    this._lastMouseOver = val;
  }
  set lastMouseOver(val) {
    this._lastMouseOver = val;
  }
  set currentSlotMarker(val) {
    this._currentSlotMarker = val;
  }
  reset() {
    this._lastMouseDown = null;
    this._lastMouseOver = null;
    this._currentSlotMarker = null;
  }
}

class GridState {
  constructor() {
    this._slots = [];
    this._slotNodes = [];
    this._baseGrid = { rows: 12, cols: 12 };
    this._gridGap = 4;
    this._parentX = 0;
    this._parentY = 0;
    this._transientGridState = new TransientGridState();
  }

  get slots() {
    return this._slots;
  }
  get slotNodes() {
    return this._slotNodes;
  }
  get baseGrid() {
    return this._baseGrid;
  }
  get gridGap() {
    return this._gridGap;
  }
  get transientGridState() {
    return this._transientGridState;
  }
  get parentX() {
    return this._parentX;
  }
  get parentY() {
    return this._parentY;
  }
  set parentX(x) {
    this._parentX = x;
  }
  set parentY(y) {
    this._parentY = y;
  }
  set baseGrid(val) {
    this._baseGrid = val;
  }
  set gridGap(val) {
    this._gridGap = val;
  }
  addSlot(slot) {
    this._slots.push(slot);
  }
  deleteSlot(uuid) {
    this._slots = this._slots.filter((sl) => sl.uuid === uuid);
  }
  resetTransientState() {
    this._transientGridState = new TransientGridState();
  }
  toJSON() {
    return {
      slots: this.slots.slice(),
      slotNodes: this.slotNodes.slice(),
      baseGrid: this.baseGrid,
      gridGap: this.gridGap,
      parentX: this.parentX,
      parentY: this.parentY,
    };
  }
  writeToStorage() {
    localStorage.setItem('gridState', JSON.stringify(this.toJSON()));
  }
  readFromStorage() {
    let data = localStorage.getItem('gridState');
    console.log(data, isEmpty(data));
    if (!isEmpty(data)) {
      data = JSON.parse(data);
      this.slots = data.slots;
      this.slotNodes = data.slotNodes;
      this.baseGrid = data.baseGrid;
      this.gridGap = data.gridGap;
      this.parentY = data.parentY;
      this.parentX = data.parentX;
    }
    return this;
  }
}

export { GridState };

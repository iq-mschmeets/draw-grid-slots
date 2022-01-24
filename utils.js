const toKey = (r, c) => `${r}_${c}`;

const cp = (obj) => JSON.parse(JSON.stringify(obj));

const uuid = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
};

const getBoundingClientRect = (element) => {
  if (!element) {
    return {};
  }
  var rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  };
};

const debounce = (func, wait, immediate) => {
  let timeout;
  return function () {
    let context = this,
      args = arguments;
    let later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const shape = function (top, left, bottom, right) {
  return {
    top: top,
    left: left,
    bottom: bottom,
    right: right,
  };
};

function getStyleForSlot(slot) {
  if (slot != null) {
    return `grid-row: ${slot.row} / span ${slot.rowSpan}; grid-column: ${slot.col} / span ${slot.colSpan};`;
  }
  return '';
}

const shapeToCSSString = (shape) => {
  if (!shape) {
    return '';
  }
  return `top:${shape.top}px; left:${shape.left}px; width:${Math.abs(
    shape.right - shape.left
  )}px; height:${Math.abs(shape.bottom - shape.top)}px;`;
};

const gridToCSSStyle = (gap, rows, cols) => {
  return `grid-gap:${gap}px;grid-template-rows:repeat(${rows},1fr);grid-template-columns:repeat(${cols},1fr);`;
};

const point = function (x, y) {
  return { x: x, y: y };
};

const isTagTarget = (evt, sel) => evt.target.matches(sel);

const reifyTemplate = (domId) => {
  return document.getElementById(domId).content.cloneNode(true);
};

const isNull = (obj) => {
  return typeof obj == 'undefined' || obj == null;
};

const isEmpty = (obj) => {
  if (isNull(obj)) {
    return true;
  }
  if (obj.length) {
    return obj.length == 0;
  }
  return false;
};

const dispatchEvent = (evtName, node, payload) => {
  node.dispatchEvent(
    new CustomEvent(evtName, {
      bubbles: true,
      detail: payload,
    })
  );
};

export {
  toKey,
  cp,
  getBoundingClientRect,
  uuid,
  getBoundingClientRect,
  debounce,
  shapeToCSSString,
  gridToCSSStyle,
  shape,
  point,
  isTagTarget,
  reifyTemplate,
  dispatchEvent,
  getStyleForSlot,
};

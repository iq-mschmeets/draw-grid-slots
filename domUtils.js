import { SlotBlock } from './SlotBlock.js';
import {
  uuid,
  getBoundingClientRect,
  shapeToCSSString,
  point,
  toKey,
} from './utils.js';

const ce = (props) => {
  let e = document.createElement('div');
  e.setAttribute('data-column', props.c);
  e.setAttribute('data-row', props.r);
  e.classList.add('slot');
  e.innerText = `r:${props.r} c:${props.c}`;
  return e;
};

const csb = (props) => {
  let e = new SlotBlock();
  e.setAttribute('data-column', props.col);
  e.setAttribute('data-row', props.row);
  e.setAttribute('data-slot-id', props.slotId);
  e.setAttribute('data-uuid', uuid());
  e.classList.add('slot-node');
  e.offset = new point(props.parentX, props.parentY);

  return e;
};

function renderGrid(parent, rows, columns, gap) {
  console.log(arguments);
  let df = document.createDocumentFragment();
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= columns; c++) {
      df.appendChild(ce({ r: r, c: c }));
    }
  }
  parent.setAttribute('class', `base-${rows}`);
  parent.innerHTML = '';
  parent.appendChild(df);
  parent.style.gridGap = `${gap}px`;
}

const getGridObject = (sl, clX, clY) => {
  if (!sl) {
    return null;
  }
  let bcr = getBoundingClientRect(sl);
  bcr.row = parseInt(sl.getAttribute('data-row'));
  bcr.col = parseInt(sl.getAttribute('data-column'));

  if (clX) {
    bcr.x = bcr.left;
  }
  if (clY) {
    bcr.y = bcr.top;
  }

  return bcr;
};

const getSlotNode = (r, c) => {
  return document.querySelector(
    `div.slot[data-column="${c}"][data-row="${r}"]`
  );
};

const topLeft = (parentX, parentY, first, last) => {
  return {
    x: first.x - parentX,
    y: first.y - parentY,
  };
};

const bottomRight = (parentX, parentY, first, last) => {
  return {
    x: last.x - parentX + last.width,
    y: last.y - parentY + last.height,
  };
};

const getSlotStyleForGlassPane = (parentX, parentY, obj) => {
  let firstNode = getGridObject(getSlotNode(obj.first.row, obj.first.col));
  let lastNode = getGridObject(getSlotNode(obj.last.row, obj.last.col));

  if (!firstNode || !lastNode) {
    return null;
  }

  let topLeftPoint = topLeft(parentX, parentY, firstNode, lastNode);
  let bottomRightPoint = bottomRight(parentX, parentY, firstNode, lastNode);

  return shapeToCSSString({
    top: topLeftPoint.y,
    left: topLeftPoint.x,
    bottom: bottomRightPoint.y,
    right: bottomRightPoint.x,
  });
  // let st = `top:${topLeftPoint.y}px; left:${topLeftPoint.x}px; width:${Math.abs(
  //   topLeftPoint.x - bottomRightPoint.x
  // )}px; height:${Math.abs(bottomRightPoint.y - topLeftPoint.y)}px;`;
};

const getGridTable = (parent) =>
  Array.from(parent.querySelectorAll('.slot'))
    // .filter((i, indx) => indx < 12)
    .map(getGridObject)
    .reduce((acc, go, indx) => {
      acc[toKey(go.row, go.col)] = go;
      return acc;
    }, {});

export {
  ce,
  csb,
  renderGrid,
  getGridObject,
  getGridObject,
  getSlotNode,
  topLeft,
  bottomRight,
  getSlotStyleForGlassPane,
  getGridTable,
  getBoundingClientRect,
};

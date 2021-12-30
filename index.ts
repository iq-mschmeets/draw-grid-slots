import './style.css';

import {
  of,
  map,
  Observable,
  tap,
  debounceTime,
  animationFrameScheduler,
  fromEvent,
  exhaustMap,
  takeUntil,
  switchMap,
  concatMap,
  subscribeOn,
} from 'rxjs';

function go() {
  const DIMENSION = 24;
  const SLOT_COUNT = DIMENSION * DIMENSION;

  const parent = document.getElementById('grid-container');
  const glassPane = document.getElementById('glass-pane');

  const cp = (obj) => JSON.parse(JSON.stringify(obj));

  const getBoundingClientRect = (element) => {
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

  const uuid = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  };

  const ce = (props) => {
    let e = document.createElement('div');
    e.setAttribute('data-column', props.c + 1);
    e.setAttribute('data-row', props.r + 1);
    e.classList.add('slot');
    e.innerText = `r:${props.r + 1} c:${props.c + 1}`;
    return e;
  };

  const cs = (props) => {
    let e = document.createElement('div');
    e.setAttribute('data-column', props.col);
    e.setAttribute('data-row', props.row);
    e.setAttribute('data-slot-id', props.slotId);
    e.classList.add('slot-node');
    e.innerText = `r:${props.row} c:${props.col}`;
    return e;
  };

  // One-time render the grid.
  for (let r = 0; r < DIMENSION; ++r) {
    for (let c = 0; c < DIMENSION; ++c) {
      parent.appendChild(ce({ r, c }));
    }
  }

  const getGridObject = (sl, clX, clY) => {
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

  const PARENT_X = getGridObject(parent).x;
  const PARENT_Y = getGridObject(parent).y;

  console.log(PARENT_X, PARENT_Y);

  function getStyleForSlot(slot) {
    if (slot != null) {
      return `grid-row: ${slot.row} / span ${slot.rowSpan}; grid-column: ${slot.col} / span ${slot.colSpan};`;
    }
    return '';
  }

  const getSlotNode = (r, c) => {
    return document.querySelector(
      `div.slot[data-column="${c}"][data-row="${r}"]`
    );
  };

  const topLeft = (first, last) => {
    return {
      x: first.x - PARENT_X,
      y: first.y - PARENT_Y,
    };
  };

  const bottomRight = (first, last) => {
    return {
      x: last.x - PARENT_X + last.width,
      y: last.y - PARENT_Y + last.height,
    };
  };

  const getSlotStyleForGlassPane = (obj) => {
    let firstNode = getGridObject(getSlotNode(obj.first.row, obj.first.col));
    let lastNode = getGridObject(getSlotNode(obj.last.row, obj.last.col));

    console.log(firstNode, lastNode);

    let topLeftPoint = topLeft(firstNode, lastNode);
    let bottomRightPoint = bottomRight(firstNode, lastNode);

    let st = `top:${topLeftPoint.y}px; left:${
      topLeftPoint.x
    }px; width:${Math.abs(
      topLeftPoint.x - bottomRightPoint.x
    )}px; height:${Math.abs(bottomRightPoint.y - topLeftPoint.y)}px;`;

    console.log(st, cp(topLeftPoint), cp(bottomRightPoint));
    return st;
  };

  const GridTable = Array.from(parent.querySelectorAll('.slot'))
    .filter((i, indx) => indx < 12)
    .map(getGridObject);

  let state = { slots: [], slotNodes: [] };

  function addSlot(obj) {
    const slot = {
      index: state.slots.length + 1,
      row: parseInt(obj.first.row),
      col: parseInt(obj.first.col),
      rowSpan: Math.max(
        parseInt(obj.last.row) - parseInt(obj.first.row) + 1,
        1
      ),
      colSpan: Math.max(
        parseInt(obj.last.col) - parseInt(obj.first.col) + 1,
        1
      ),
      slotId: uuid(),
    };

    state.slots.push(slot);

    const sNode = cs(slot);
    console.log('getSlotStyleForClassPane ', obj);
    sNode.setAttribute('style', getSlotStyleForGlassPane(obj));

    state.slotNodes.push(sNode);
    glassPane.appendChild(sNode);
  }

  const mouseDowns = fromEvent(parent, 'mousedown');
  const mouseUps = fromEvent(window, 'mouseup');
  const mouseOvers = fromEvent(parent, 'mouseover');

  const mouseObserver = mouseDowns.pipe(
    map((evt) => {
      state.lastMouseDown = getGridObject(evt.target, evt.clientX, evt.clientY);
      console.log('mousedown ', cp(state.lastMouseDown));
      return evt;
    }),
    switchMap((evt) => {
      return mouseOvers.pipe(
        debounceTime(20),
        map((over) => {
          over.preventDefault();
          return getGridObject(over.target, over.clientX, over.clientY);
        }),
        takeUntil(mouseUps)
      );
    })
  );

  const mouseSubscriber = mouseObserver.pipe(
    subscribeOn(animationFrameScheduler)
  );

  mouseSubscriber.subscribe((evt) => {
    state.lastMouseOver = evt;
    console.log('over ', cp(evt));
  });

  mouseUps.subscribe((e) => {
    let local = cp(state);
    console.log('mouseUp ', cp(local));
    addSlot({
      first: local.lastMouseDown,
      last: local.lastMouseOver,
    });
    delete state.lastMouseDown;
    delete state.lastMouseOver;
  });
}

go();

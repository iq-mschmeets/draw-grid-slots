import './style.css';
import SlotBlock from './SlotBlock.js';
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

  const main = document.getElementsByTagName('main')[0];
  const parent = document.getElementById('grid-container');
  const glassPane = document.getElementById('glass-pane');

  const cp = (obj) => JSON.parse(JSON.stringify(obj));

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
    e.innerText = `r:${props.r} c:${props.c}`;
    return e;
  };

  const csb = (props) => {
    let e = new SlotBlock();
    e.setAttribute('data-column', props.col);
    e.setAttribute('data-row', props.row);
    e.setAttribute('data-slot-id', props.slotId);
    e.classList.add('slot-node');

    // e.innerText = `r:${props.row} c:${props.col}`;
    return e;
  };

  function renderGrid(rows, columns, gap) {
    let df = document.createDocumentFragment();
    for (let r = 0; r < rows; ++r) {
      for (let c = 0; c < columns; ++c) {
        df.appendChild(ce({ r: r + 1, c: c + 1 }));
      }
    }
    parent.setAttribute('class', `base-${rows}`);
    parent.innerHTML = '';
    parent.appendChild(df);
    parent.style.gridGap = gap ? `${gap}px` : '4px';
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

  const getGridTable = () =>
    Array.from(parent.querySelectorAll('.slot'))
      .filter((i, indx) => indx < 12)
      .map(getGridObject);

  let state = { slots: [], slotNodes: [], baseGrid: 24, gridGap: 4 };

  const PARENT_X = getGridObject(parent).x;
  const PARENT_Y = getGridObject(parent).y;

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

    if (!firstNode || !lastNode) {
      return null;
    }

    let topLeftPoint = topLeft(firstNode, lastNode);
    let bottomRightPoint = bottomRight(firstNode, lastNode);

    let st = `top:${topLeftPoint.y}px; left:${
      topLeftPoint.x
    }px; width:${Math.abs(
      topLeftPoint.x - bottomRightPoint.x
    )}px; height:${Math.abs(bottomRightPoint.y - topLeftPoint.y)}px;`;

    return st;
  };

  function renderSlotMarker(obj) {
    const node = csb({
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
    });

    return updateSlotNode(node, obj);
  }

  function updateSlotNode(node, obj) {
    let props = cp(obj);
    if (props.first && props.last) {
      requestAnimationFrame(() => {
        const str = getSlotStyleForGlassPane(props);
        if (str) {
          node.setAttribute('style', str);
        }
      });
    }
    return node;
  }

  function addSlot(obj) {
    if (!obj) {
      return;
    }
    const slot = {
      row: obj.node.row, //parseInt(obj.first.row),
      col: obj.node.col, //parseInt(obj.first.col),
      rowSpan: Math.max(
        parseInt(obj.last.row) - parseInt(obj.first.row) + 1,
        1
      ),
      colSpan: Math.max(
        parseInt(obj.last.col) - parseInt(obj.first.col) + 1,
        1
      ),
      slotId: obj.node.slotId,
      uuid: obj.node.uuid,
      node: obj.node,
    };

    state.slots.push(slot);
  }

  function resetStateForBaseGridChange(dim) {
    console.log('resetStateForBaseGridChange %s, %o', dim, cp(state));
    state.baseGrid = dim;
    glassPane.innerHTML = '';
    parent.innerHTML = '';
    delete state.currentSlotMarker;
    delete state.lastMouseDown;
    delete state.lastMouseOver;
    renderGrid(dim, dim, state.gridGap);
  }

  ////////////////////////////////////////////////////////
  // BEGIN observable section.
  ////////////////////////////////////////////////////////
  const mouseDowns = fromEvent(parent, 'mousedown');
  const mouseUps = fromEvent(main, 'mouseup');
  const mouseOvers = fromEvent(parent, 'mouseover');

  const baseGridDimension = fromEvent(
    document.getElementById('base-grid-selector'),
    'change'
  ).subscribe((evt) => {
    resetStateForBaseGridChange(Number(evt.target.value));
  });

  const baseGridGap = fromEvent(
    document.getElementById('base-grid-gap'),
    'change'
  ).subscribe((evt) => {
    state.gridGap = Number(evt.target.value);
    resetStateForBaseGridChange(state.baseGrid);
  });

  const resetGrid = fromEvent(
    document.getElementById('reset-grid'),
    'click'
  ).subscribe((evt) => {
    state = { slots: [], slotNodes: [], baseGrid: 24, gridGap: 4 };
    resetStateForBaseGridChange(state.baseGrid);
  });

  const deleteSlot = fromEvent(glassPane, 'delete_slot').subscribe((evt) => {
    let data = evt.detail;
    state.slots = state.slots.filter((sl) => sl.uuid !== data.uuid);
    glassPane.removeChild(evt.target);
    console.log('post delete state: %o', state);
  });

  const mouseObserver = mouseDowns.pipe(
    map((evt) => {
      state.lastMouseDown = getGridObject(evt.target, evt.clientX, evt.clientY);
      console.log('mousedown ', cp(state.lastMouseDown));
      return evt;
    }),
    switchMap((evt) => {
      return mouseOvers.pipe(
        debounceTime(30),
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

    if (!state.currentSlotMarker) {
      state.currentSlotMarker = renderSlotMarker({
        first: state.lastMouseDown,
        last: state.lastMouseOver,
        slotId: state.slots.length,
        uuid: uuid(),
      });
      state.currentSlotMarker.setAttribute(
        'data-slot-id',
        state.slots.length + 1
      );
      requestAnimationFrame(() =>
        glassPane.appendChild(state.currentSlotMarker)
      );
    } else {
      updateSlotNode(state.currentSlotMarker, {
        first: state.lastMouseDown,
        last: state.lastMouseOver,
      });
    }
    console.log('over ', cp(evt));
  });

  mouseUps.subscribe((e) => {
    let local = cp(state);
    console.log('mouseUp ', cp(local));
    addSlot({
      first: local.lastMouseDown,
      last: local.lastMouseOver,
      node: local.currentSlotMarker,
    });
    delete state.lastMouseDown;
    delete state.lastMouseOver;
    delete state.currentSlotMarker;
  });

  ////////////////////////////////////////////////////////
  // END observable section.
  ////////////////////////////////////////////////////////

  renderGrid(DIMENSION, DIMENSION);
}

go();

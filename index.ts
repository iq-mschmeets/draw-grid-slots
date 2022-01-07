import './style.css';

import { uuid, cp } from './utils.js';
import {
  csb,
  renderGrid,
  getGridObject,
  getSlotStyleForGlassPane,
  getGridTable,
} from './domUtils.js';

import {
  map,
  tap,
  debounceTime,
  animationFrameScheduler,
  fromEvent,
  takeUntil,
  switchMap,
  subscribeOn,
} from 'rxjs';

function go() {
  const DIMENSION = 24;

  const main = document.getElementsByTagName('main')[0];
  const parent = document.getElementById('grid-container');
  const glassPane = document.getElementById('glass-pane');

  let state = { slots: [], slotNodes: [], baseGrid: 24, gridGap: 4 };

  const PARENT_X = getGridObject(parent).x;
  const PARENT_Y = getGridObject(parent).y;

  console.log(PARENT_X, PARENT_Y);

  function getStyleForSlot(slot) {
    if (slot != null) {
      return `grid-row: ${slot.row} / span ${slot.rowSpan}; grid-column: ${slot.col} / span ${slot.colSpan};`;
    }
    return '';
  }

  function renderSlotBlock(obj) {
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
      parentX: PARENT_X,
      parentY: PARENT_Y,
    });

    return updateSlotBlock(node, obj);
  }

  function updateSlotBlock(node, obj) {
    let props = cp(obj);
    if (props.first && props.last) {
      requestAnimationFrame(() => {
        const str = getSlotStyleForGlassPane(PARENT_X, PARENT_Y, props);
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
      row: obj.node.row,
      col: obj.node.col,
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
    renderGrid(parent, dim, dim, state.gridGap);
    console.time('ggt');
    console.log(getGridTable());
    console.timeEnd('ggt');
  }

  ////////////////////////////////////////////////////////
  // BEGIN observable section.
  ////////////////////////////////////////////////////////
  const mouseDowns = fromEvent(parent, 'pointerdown');
  const mouseUps = fromEvent(main, 'pointerup');
  const mouseOvers = fromEvent(parent, 'pointerover');

  const actions = fromEvent(glassPane, 'action').subscribe((evt) => {
    // the evt.target is the DOM node, any updates will be to the
    // attributes of that node.
    // The current state of the slot is available in the evt.detail.
    console.log(evt);
  });

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
      state.lastMouseDown = getGridObject(evt.target, evt.offsetX, evt.offsetY);
      return evt;
    }),
    switchMap((evt) => {
      return mouseOvers.pipe(
        debounceTime(20),
        map((over) => {
          over.preventDefault();
          return getGridObject(over.target, over.offsetX, over.offsetY);
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
      state.currentSlotMarker = renderSlotBlock({
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
      updateSlotBlock(state.currentSlotMarker, {
        first: state.lastMouseDown,
        last: state.lastMouseOver,
      });
    }
  });

  mouseUps.subscribe((e) => {
    let local = cp(state);
    console.log('mouseUps ', local);
    if (local.hasOwnProperty('lastMouseOver')) {
      addSlot({
        first: local.lastMouseDown,
        last: local.lastMouseOver,
        node: local.currentSlotMarker,
      });
    }

    delete state.lastMouseDown;
    delete state.lastMouseOver;
    delete state.currentSlotMarker;
  });

  ////////////////////////////////////////////////////////
  // END observable section.
  ////////////////////////////////////////////////////////

  renderGrid(parent, DIMENSION, DIMENSION);
}

go();

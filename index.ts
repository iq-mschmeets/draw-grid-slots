import './style.css';

import { uuid, cp, gridToCSSStyle } from './utils.js';
import { GridState } from './GridState.js';
import {
  csb,
  renderGrid,
  getGridObject,
  getSlotStyleForGlassPane,
  getGridTable,
} from './domUtils.js';
import { ContentPlaceholder } from './ContentPlaceholder.js';
import { DimensionSelector } from './DimensionSelector.js';

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
  const main = document.getElementsByTagName('main')[0];
  const parent = document.getElementById('grid-container');
  const glassPane = document.getElementById('glass-pane');

  let state = null;
  try {
    state = new GridState().readFromStorage();
  } catch (er) {
    console.error(er);
  }

  state.parentX = getGridObject(parent).x;
  state.parentY = getGridObject(parent).y;

  console.log(state);

  function updateSlotBlock(node, obj) {
    if (obj.row && obj.col && obj.rowSpan && obj.colSpan) {
      const str = getSlotStyleForGlassPane(
        state.parentX,
        state.parentY,
        obj.row,
        obj.col,
        obj.rowSpan,
        obj.colSpan
      );
      console.log('updateSlotBlock %o, %s', obj, str);
      // requestAnimationFrame(() => {
      if (str) {
        node.setAttribute('style', str);
      }
      // });
    }
    return node;
  }

  function xformSlotDataObj(obj) {
    return {
      row: parseInt(obj.first.row),
      col: parseInt(obj.first.col),
      rowSpan: Math.max(parseInt(obj.last.row) - parseInt(obj.first.row), 1),
      colSpan: Math.max(parseInt(obj.last.col) - parseInt(obj.first.col), 1),
      slotId: obj.slotId,
      uuid: obj.uuid,
      parentX: state.parentX,
      parentY: state.parentY,
    };
  }

  function renderSlotBlock(obj) {
    let dat = {};
    if (obj.first) {
      dat = xformSlotDataObj(obj);
    } else {
      dat.row = obj.row;
      dat.col = obj.column;
      dat.rowSpan = obj.rowSpan;
      dat.colSpan = obj.colSpan;
      dat.uuid = obj.uuid;
      dat.slotId = obj.slotId;
      dat.parentX = state.parentX;
      dat.parentY = state.parentY;
    }
    const node = csb(dat);
    console.log('renderSlotBlock %o, %o', dat, node);

    return updateSlotBlock(node, dat);
  }

  function addSlot(obj) {
    if (!obj || !obj.node) {
      return;
    }

    obj.node.setAttribute(
      'data-row-span',
      Math.max(parseInt(obj.last.row) - parseInt(obj.first.row) + 1, 1)
    );

    obj.node.setAttribute(
      'data-col-span',
      Math.max(parseInt(obj.last.col) - parseInt(obj.first.col) + 1, 1)
    );

    obj.node.setAttribute('data-slot-id', state.slots.length + 1);

    state.addSlot(obj.node.state);
  }

  function resetStateForBaseGridChange() {
    glassPane.innerHTML = '';
    parent.innerHTML = '';
    state.transientGridState.reset();
    const bg = state.baseGrid;

    renderGrid(parent, bg.rows, bg.cols, state.gridGap);

    parent.setAttribute(
      'style',
      gridToCSSStyle(state.gridGap, bg.rows, bg.cols)
    );

    console.time('ggt');
    console.log(getGridTable(parent));
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
    console.log('Action Event: ', evt);
    if (evt.detail.type === 'slot-block-resize') {
      // Find the corresponding grid cells, based on the dimensions
      // of the evt.details, then update the slot-block for new
      // row, col, rowSpan, colSpan props.
      state.writeToStorage();
    }
  });

  const baseGridGap = fromEvent(
    document.getElementById('base-grid-gap'),
    'change'
  ).subscribe((evt) => {
    state.gridGap = Number(evt.target.value);
    resetStateForBaseGridChange();
  });

  const resetGrid = fromEvent(
    document.getElementById('reset-grid'),
    'click'
  ).subscribe((evt) => {
    state = new GridState();
    resetStateForBaseGridChange(state.baseGrid);
  });

  const deleteSlot = fromEvent(glassPane, 'delete_slot').subscribe((evt) => {
    let data = evt.detail;
    state.deleteSlot(data.uuid);
    glassPane.removeChild(evt.target);
  });

  const mouseObserver = mouseDowns.pipe(
    map((evt) => {
      state.transientGridState.lastMouseDown = getGridObject(
        evt.target,
        evt.offsetX,
        evt.offsetY
      );
      // state.transientGridState.lastMouseOver = getGridObject(
      //   evt.target,
      //   evt.offsetX,
      //   evt.offsetY
      // );

      return evt;
    }),
    // tap(() => {
    //   renderSlotBlock({
    //     first: state.transientGridState.lastMouseDown,
    //     last: state.transientGridState.lastMouseOver,
    //     slotId: state.slots.length,
    //     uuid: uuid(),
    //   });
    // }),
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
    state.transientGridState.lastMouseOver = evt;

    if (!state.transientGridState.currentSlotMarker) {
      state.transientGridState.currentSlotMarker = renderSlotBlock({
        first: state.transientGridState.lastMouseDown,
        last: state.transientGridState.lastMouseOver,
        slotId: state.slots.length,
        uuid: uuid(),
      });
      requestAnimationFrame(() =>
        glassPane.appendChild(state.transientGridState.currentSlotMarker)
      );
    } else {
      updateSlotBlock(state.transientGridState.currentSlotMarker, {
        first: state.transientGridState.lastMouseDown,
        last: state.transientGridState.lastMouseOver,
      });
    }
  });

  mouseUps.subscribe((e) => {
    console.log('mouseUps ', state.transientGridState);
    if (state.transientGridState) {
      addSlot({
        first: state.transientGridState.lastMouseDown,
        last: state.transientGridState.lastMouseOver,
        node: state.transientGridState.currentSlotMarker,
      });
      state.writeToStorage();
    }

    state.transientGridState.reset();
  });

  ////////////////////////////////////////////////////////
  // END observable section.
  ////////////////////////////////////////////////////////

  renderGrid(parent, state.baseGrid.rows, state.baseGrid.cols, state.gridGap);
  state.slots.forEach((sl) => {
    glassPane.appendChild(renderSlotBlock(sl));
  });

  ////////////////////////////////////////////////////////
  // Begin add dummy content.
  ////////////////////////////////////////////////////////

  let contentContainer = document.querySelector(
    'article#content-available>div.content'
  );
  console.log(contentContainer);

  let filters = new ContentPlaceholder();
  filters.templateId = 'filter-section';
  filters.headerText = 'Filters';

  // let folders = new ContentPlaceholder();
  // folders.templateId = 'content-sections';
  // folders.headerText = 'Folders';

  // let summaries = new ContentPlaceholder();
  // summaries.templateId = 'content-sections';
  // summaries.headerText = 'Summaries';

  // let markups = new ContentPlaceholder();
  // markups.templateId = 'content-sections';
  // markups.headerText = 'Markups';

  let dimSel = new DimensionSelector();
  dimSel.setAttribute('id', 'base-grid-selector');

  requestAnimationFrame(() => {
    contentContainer.appendChild(filters);
    contentContainer.appendChild(folders);
    contentContainer.appendChild(summaries);
    contentContainer.appendChild(markups);
    document.getElementById('dim-sel-label').appendChild(dimSel);
  });

  setTimeout(() => {
    const baseGridCustomDimension = fromEvent(dimSel, 'action').subscribe(
      (evt) => {
        state.baseGrid = {
          rows: evt.detail.rows,
          cols: evt.detail.cols,
        };
        console.log(evt, state.baseGrid);
        resetStateForBaseGridChange();
      }
    );
  }, 10);
}

go();

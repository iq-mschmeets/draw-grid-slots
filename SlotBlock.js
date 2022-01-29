import {
  getBoundingClientRect,
  debounce,
  shape,
  point,
  shapeToCSSString,
  isTagTarget,
  dispatchEvent,
  settableProp,
} from './utils.js';

function getTemplate() {
  let d = document.createElement('div');
  d.style.height = '100%';
  d.innerHTML = `
    <style>
      .slot-block-inner{
        display:flex;
        flex-direction:column;
        justify-content: center;
        align-items:center;
        width: 100%;
        height: 100%;
        min-height: 100%;
        pointer-events:auto;
        position:relative;
      }
      :host{ pointer-events:auto;}
      .tl,.tr,.br,.bl{position:absolute;background-color:#333;height:20px;width:20px;}
      .tl{top:0;left:0;}
      .tr{top:0;right:0;}
      .bl{bottom:0;left:0;}
      .br{bottom:0;right:0;}
    </style>
    <div class='slot-block-inner' style='height:100%;'>
        <div class="tl"></div>
        <div class="tr"></div>
        <span>Slot: <strong id="r"></strong> </span>
        <span><button class="d-button">Delete</button></span>
        <div class="bl"></div>
        <div class="br"></div>
    </div>
  `;
  return d;
}

const pointerMoveFactory = (node) => {
  const _this = node;

  function pointerMoveHandler(evt) {
    _this.onPointerMove(evt);
  }

  // return debounce(pointerMoveHandler, 5, false);
  return pointerMoveHandler;
};

const pointerCoords = (evt, offset) => {
  if (offset) {
    return new point(evt.clientX - offset.x, evt.clientY - offset.y);
  } else {
    return new point(evt.clientX, evt.clientY);
  }
};

// so we have some clue as to directionality
const tlMoved = (mousePoint, parentRect) => {
  return {
    top: mousePoint.y,
    left: mousePoint.x,
    bottom: parentRect.bottom,
    right: parentRect.right,
  };
};
const trMoved = (mousePoint, parentRect) => {
  return {
    top: mousePoint.y,
    left: parentRect.left,
    bottom: parentRect.bottom,
    right: mousePoint.x,
  };
};
const blMoved = (mousePoint, parentRect) => {
  return {
    top: parentRect.top,
    left: mousePoint.x,
    bottom: mousePoint.y,
    right: parentRect.right,
  };
};
const brMoved = (mousePoint, parentRect) => {
  return {
    top: parentRect.top,
    left: parentRect.left,
    bottom: mousePoint.y,
    right: mousePoint.x,
  };
};

const mouseMoveMap = {
  tl: tlMoved,
  tr: trMoved,
  bl: blMoved,
  br: brMoved,
};

const adjustDims = (shape) => {
  return shape;
};

class PointerState {
  constructor() {
    this._pointerDownTarget = null;
    this._pointerDownShape = null;
    this._pointerLastCapture = null;
    this._isMoving = false;
    this.setLastCapture = this.setLastCapture.bind(this);
  }
  set downTarget(val) {
    this._pointerDownTarget = val;
    this._isMoving = true;
  }
  set downShape(val) {
    this._pointerDownShape = val;
    this._pointerLastCapture = val;
  }
  get isMoving() {
    return this._isMoving;
  }
  get downTarget() {
    return this._pointerDownTarget;
  }
  get downShape() {
    return this._pointerDownShape;
  }
  get lastCapture() {
    return this._pointerLastCapture;
  }
  get state() {
    return {
      target: this._pointerDownTarget,
      shape: this._pointerDownShape,
      capture: this._pointerLastCapture,
      styleString: this.styleAttributeString,
    };
  }
  get styleAttributeString() {
    return shapeToCSSString(adjustDims(this.lastCapture));
  }
  setLastCapture(pointerCoordinates) {
    let handler = mouseMoveMap[this.downTarget.getAttribute('class')];
    if (!handler) {
      // first time through.
      if (!this._lastPointerCoordinates) {
        this._lastPointerCoordinates = pointerCoordinates;
        this._pointerLastCapture = this.downShape;
        return;
      } else {
        let deltaCoords = {
          x: this._lastPointerCoordinates.x - pointerCoordinates.x,
          y: this._lastPointerCoordinates.y - pointerCoordinates.y,
        };
        this._pointerLastCapture = {
          top: this._pointerLastCapture.top - deltaCoords.y,
          left: this._pointerLastCapture.left - deltaCoords.x,
          bottom: this._pointerLastCapture.bottom - deltaCoords.y,
          right: this._pointerLastCapture.right - deltaCoords.x,
        };
      }
    } else {
      this._pointerLastCapture = handler(pointerCoordinates, this.downShape);
    }
    this._lastPointerCoordinates = pointerCoordinates;
  }
  reset() {
    this._isMoving = false;
    this._pointerDownTarget = null;
    this._pointerDownShape = null;
    this._pointerLastCapture = null;
  }
  toString() {
    return `target:${this._pointerDownTarget}, shape:${this._pointerDownShape}, capture:${this._pointerLastCapture}`;
  }
}

class SlotBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open',
    });

    this.shadowRoot.appendChild(getTemplate());
    this.onDelete = this.onDelete.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.pointerState = new PointerState();
  }

  static get observedAttributes() {
    return [
      'data-column',
      'data-row',
      'data-slot-id',
      'data-uuid',
      'data-col-span',
      'data-row-span',
    ];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-slot-id') {
      this.slotId = newVal;
    }
  }

  set offset(point) {
    this._offset = point;
  }

  set slotId(val) {
    this._slotId = val;
    this.shadowRoot.querySelector('#r').innerText = val;
  }

  get column() {
    return parseInt(this.getAttribute('data-column'));
  }

  get colSpan() {
    return parseInt(this.getAttribute('data-col-span'));
  }

  get rowSpan() {
    return parseInt(this.getAttribute('data-row-span'));
  }

  get row() {
    return parseInt(this.getAttribute('data-row'));
  }

  get slotId() {
    return this.getAttribute('data-slot-id');
  }

  get uuid() {
    return this.getAttribute('data-uuid');
  }

  get state() {
    return {
      slotId: this.slotId,
      row: settableProp('row', this.row, this),
      column: settableProp('column', this.column, this),
      uuid: this.uuid,
      colSpan: settableProp('colSpan', this.colSpan, this),
      rowSpan: settableProp('rowSpan', this.rowSpan, this),
      shape: getBoundingClientRect(this),
    };
  }

  get offsetShape() {
    return new shape(
      this.offsetTop,
      this.offsetLeft,
      this.offsetTop + this.offsetHeight,
      this.offsetLeft + this.offsetWidth
    );
  }

  el() {
    return this.shadowRoot.querySelector('.slot-block-inner');
  }

  connectedCallback() {
    this.shadowRoot
      .querySelector('button')
      .addEventListener('click', this.onDelete);

    let el = this.el();
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
  }

  disconnectedCallback() {
    let el = this.el();
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.querySelector('button').removeEventListener('click', this.onDelete);
  }

  onDelete(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('delete_slot', {
        bubbles: true,
        detail: { row: this.row, column: this.column, uuid: this.uuid },
      })
    );
  }

  onPointerDown(evt) {
    if (isTagTarget(evt, 'button.d-button')) {
      return;
    }
    this.pointerState.downTarget = evt.composedPath()[0];
    this.pointerState.downShape = this.offsetShape;

    this.el().setPointerCapture(evt.pointerId);

    // console.log(
    //   '%s.onMouseDown %o, %o, %s',
    //   this.tagName,
    //   this.pointerState.downShape,
    //   evt,
    //   this.getAttribute('style')
    // );
  }

  onPointerUp(evt) {
    if (isTagTarget(evt, 'button.d-button')) {
      return;
    }
    // console.log(
    //   '%s.onMouseUp %o, %o, %o, %o',
    //   this.tagName,
    //   evt,
    //   this.pointerState.state
    // );

    if (this.pointerState.isMoving) {
      evt.stopPropagation();

      this.el().releasePointerCapture(evt.pointerId);

      this.pointerState.reset();

      dispatchEvent(
        'action',
        this,
        Object.assign(
          { type: 'slot-block-resize', slotBlock: this },
          this.state
        )
      );
    }
  }

  onPointerMove(evt) {
    if (!this.pointerState.isMoving) {
      return;
    }
    evt.stopPropagation();

    this.pointerState.setLastCapture(pointerCoords(evt, this._offset));
    this.setAttribute('style', this.pointerState.styleAttributeString);
  }

  onKeyUp(evt) {
    console.log('%s.onKeyUp %o', this.tagName, evt);
  }
}
if (window.customElements.get('slot-block') === undefined) {
  window.customElements.define('slot-block', SlotBlock);
}

export { SlotBlock };

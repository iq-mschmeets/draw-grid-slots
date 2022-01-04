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
        border: 2px dotted white;
        pointer-events:auto;
      }
    </style>
    <div class='slot-block-inner' style='height:100%;'>
        <span>ID <strong id="r"></strong> </span>
        <span><button>Delete</button></span>
    </div>
  `;
  return d;
}

export default class SlotBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open',
    });

    this.shadowRoot.appendChild(getTemplate());
    this.onDelete = this.onDelete.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    console.log('%s.CTOR %o', this.tagName, this.shadowRoot.innerHTML);
  }
  static get observedAttributes() {
    return ['data-column', 'data-row', 'data-slot-id', 'data-uuid'];
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-column') {
      this.column = parseInt(newVal);
    } else if (name === 'data-row') {
      this.row = parseInt(newVal);
    } else if (name === 'data-slot-id') {
      this.slotId = newVal;
    } else if (name === 'data-uuid') {
      this.uuid = newVal;
    }
  }
  set column(val) {
    this._column = val;
  }
  set row(val) {
    this._row = val;
  }
  set slotId(val) {
    this._slotId = val;
    this.shadowRoot.querySelector('#r').innerText = val;
  }
  set uuid(val) {
    this._uuid = val;
  }
  get column() {
    return this.getAttribute('data-column');
  }
  get row() {
    return this.getAttribute('data-row');
  }
  get slotId() {
    return this.getAttribute('data-slot-id');
  }
  get uuid() {
    return this.getAttribute('data-uuid');
  }
  connectedCallback() {
    console.log(this.shadowRoot.innerHTML);
    console.log(getTemplate());
    this.shadowRoot
      .querySelector('button')
      .addEventListener('click', this.onDelete);
    this.shadowRoot.addEventListener('mouseup', this.onMouseUp);
  }
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('mouseup', this.onMouseUp);
    this.shadowRoot
      .querySelector('button')
      .removeEventListener('click', this.onDelete);
  }
  onDelete(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    console.log('DELETE');
    this.dispatchEvent(
      new CustomEvent('delete_slot', {
        bubbles: true,
        detail: { row: this.row, column: this.column },
      })
    );
  }
  onMouseUp(evt) {
    console.log('%s.onMouseUp %o', this.tagName, evt);
    if (evt.target.tagName === 'BUTTON') {
      evt.stopPropagation();
    }
  }
}
window.customElements.define('slot-block', SlotBlock);

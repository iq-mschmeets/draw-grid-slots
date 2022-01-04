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
  }

  static get observedAttributes() {
    return ['data-column', 'data-row', 'data-slot-id', 'data-uuid'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-slot-id') {
      this.slotId = newVal;
    }
  }

  set slotId(val) {
    this._slotId = val;
    this.shadowRoot.querySelector('#r').innerText = val;
  }

  get column() {
    return parseInt(this.getAttribute('data-column'));
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

  connectedCallback() {
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
if (window.customElements.get('slot-block') === undefined) {
  window.customElements.define('slot-block', SlotBlock);
}

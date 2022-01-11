import { reifyTemplate, dispatchEvent } from './utils.js';

class DimensionSelector extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({
    //   mode: 'open',
    // });
    //this.shadowRoot.appendChild( getTemplate() );
    this._templateId = 'dimension-selector';
    this.listClickHandler = this.listClickHandler.bind(this);
    this.onDimensionColValueChange = this.onDimensionColValueChange.bind(this);
    this.onDimensionRowValueChange = this.onDimensionRowValueChange.bind(this);
  }
  static get observedAttributes() {
    return [];
  }
  set templateId(val) {
    this._templateId = val;
  }
  set headerText(val) {
    this._headerText = val;
  }
  attributeChangedCallback(name, oldVal, newVal) {}
  connectedCallback() {
    this._el = reifyTemplate(this._templateId);
    this.appendChild(this._el);

    this.querySelector('#grid-type-selector').addEventListener(
      'change',
      this.listClickHandler
    );

    this.querySelector('#grid-type-row-dim').addEventListener(
      'change',
      this.onDimensionRowValueChange
    );

    this.querySelector('#grid-type-col-dim').addEventListener(
      'change',
      this.onDimensionColValueChange
    );
  }
  disconnectedCallback() {
    if (this._el) {
      this.querySelector('#grid-type-selector').removeEventListener(
        'change',
        this.listClickHandler
      );
      this._el.innerHTML = '';
    }
  }
  reset() {
    delete this._customRowValue;
    delete this._customColValue;
    this.querySelector('#grid-type-selector').value = 12;
  }
  dispatch() {
    if (
      this._customRowValue &&
      this._customRowValue > 0 &&
      this._customColValue &&
      this._customColValue > 0
    ) {
      dispatchEvent('action', this, {
        type: 'grid-dimension-change',
        rows: parseInt(this._customRowValue),
        cols: parseInt(this._customColValue),
      });
    }
  }
  listClickHandler(evt) {
    console.log('%s.listClickHandler ', this.tagName, evt);
    this._optionValue = evt.target.value;
    evt.preventDefault();
    evt.stopPropagation();
    if (this._optionValue == -1) {
      this.querySelector('#grid-type-dims').style.display = 'block';
    } else {
      this._customRowValue = evt.target.value;
      this._customColValue = evt.target.value;
      this.querySelector('#grid-type-dims').style.display = 'none';
      this.dispatch();
    }
  }
  onDimensionRowValueChange(evt) {
    this._customRowValue = evt.target.value;
    this.dispatch();
  }
  onDimensionColValueChange(evt) {
    this._customColValue = evt.target.value;
    this.dispatch();
  }
}
if (window.customElements.get('dimension-selector') === undefined) {
  window.customElements.define('dimension-selector', DimensionSelector);
}

export { DimensionSelector };

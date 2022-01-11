import { reifyTemplate } from './utils.js';

class DimensionSelector extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({
    //   mode: 'open',
    // });
    //this.shadowRoot.appendChild( getTemplate() );
    this._templateId = 'dimension-selector';
    this._headerText = '';
    this.listClickHandler = this.listClickHandler.bind(this);
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
    let el = reifyTemplate(this._templateId);
  }
  disconnectedCallback() {}
  listClickHandler(evt) {
    this._optionValue = evt.target.value;
  }
}
if (window.customElements.get('dimension-selector') === undefined) {
  window.customElements.define('dimension-selector', DimensionSelector);
}

export { DimensionSelector };

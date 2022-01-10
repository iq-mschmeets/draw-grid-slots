import { reifyTemplate } from './utils.js';

class ContentPlaceholder extends HTMLElement {
  constructor() {
    super();
    // this.attachShadow({
    //   mode: 'open',
    // });
    //this.shadowRoot.appendChild( getTemplate() );
    this._templateId = 'content-sections';
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
    el.querySelector('h5.section-title').innerText = this._headerText;
    this.appendChild(el);

    let list = this.querySelector('ul');
    list.addEventListener('click', this.listClickHandler);
  }
  disconnectedCallback() {
    let list = this.querySelector('ul');
    list.removeEventListener('click', this.listClickHandler);
  }
  listClickHandler(evt) {
    let listItems = Array.from(this.querySelectorAll('ul>li'));
    listItems.forEach((li) => {
      li.classList.remove('selected');
    });
    evt.target.classList.add('selected');
  }
}
if (window.customElements.get('content-placeholder') === undefined) {
  window.customElements.define('content-placeholder', ContentPlaceholder);
}

export { ContentPlaceholder };

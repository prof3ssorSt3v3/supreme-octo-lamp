let template = document.createElement('template');
template.innerHTML = `
  <style>
  .overlay {
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: hsla(0, 0%, 0%, 0.72);
    display: grid;
    place-content: center;
  }
  .modal {
    background: linear-gradient(#dfdfdf, hsl(220, 20%, 80%));
    color: #333;
    border: 1px solid currentColor;
    border-top: 1rem solid currentColor;
    border-bottom-left-radius: 1rem;
    border-bottom-right-radius: 1rem;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 1rem;
    font-weight: 300;
    padding: 1rem;
    width: clamp(200px, 80vw, 600px);
    cursor: pointer;
  }
  .modal.info {
    color: #135e97;
  }
  .modal.success {
    color: #085c08;
  }
  .modal.error {
    color: #af1015;
  }
  </style>
  <div class="overlay">
    <div class="modal ">
      <slot name="message">Some kind of message.</slot>
    </div>
  </div>
`;

class ModalNotice extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'closed' });
    const copy = template.content.cloneNode(true);
    shadowRoot.append(copy);
    this.modal = shadowRoot.querySelector('.modal');
  }
  static get observedAttributes() {
    return ['type', 'delay'];
  }
  get type() {
    return this.getAttribute('type');
  }
  set type(value) {
    this.setAttribute('type', value);
  }
  get delay() {
    return +this.getAttribute('delay');
  }
  set delay(value) {
    if (!isNaN(value)) {
      this.setAttribute('delay', value);
    }
  }
  connectedCallback() {
    //method is run when the web component is added to the web page
  }
  disconnectedCallback() {
    //method is run when the web component is removed from the web page
  }
  attributeChangedCallback(attributeName, oldVal, newVal) {
    switch (attributeName) {
      case 'type':
        if (newVal === 'success' || newVal === 'info' || newVal === 'error') {
          this.modal.classList.add(newVal);
        } else {
          //default to 'info'
          this.modal.classList.add('info');
        }
        break;
      case 'delay':
        //if this property exists then it is the milliseconds to self remove
        setTimeout(() => {
          const modal = window.document.querySelector('modal-notice');
          modal?.remove();
        }, this.delay);
        break;
    }
  }
}

window.customElements.define('modal-notice', ModalNotice);

/*
Usage:
<modal-notice type="error|info|success">
  <p slot="message">some message</p>
</modal>
*/

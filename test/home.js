import { createElement as _, lazy, createRef, useState } from './dist/vanilact.js';
const Layout = lazy( () => import( './layout.js' ) );
// import Layout from './layout.js';
export default class Home {
  constructor() {
    this.button = createRef();
    this.iframe = createRef();
    [ this.count, this.setCount ] = useState( 0 );
    throw new Error( "test" );
  }
  render () {
    return _( Layout, {},
      _( 'div', { class: "container", style: "margin-top: 100px" },
        _( 'div', { class: "row" },
          _( 'div', { class: "col-lg-12" },
            _( 'button', { ref: this.button, class: "clicker", onclick: () => this.setCount( this.count + 1 ) }, 'Clicker ' + this.count ),
            _( 'br' ),
            _( 'iframe', { ref: this.iframe, width: "1000px", height: "700px", class: 'iframe', src: "#" } )
          )
        )
      )
    );
  }
  setDom ( dom ) {
    this.dom = dom;
  }
  getDom ( selector ) {
    if ( selector ) return this.dom.querySelector( selector );
    return this.dom;
  }
  onMount () {
    console.log( this.getDom() );
    if ( this.getDom( 'iframe.iframe' ) )
      this.getDom( 'iframe.iframe' ).src = "https://example.com/";
  }
}
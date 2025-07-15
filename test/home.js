import { createElement as _, lazy, createRef, useState, onSetup } from './dist/vanilact.js';
const Layout = lazy( () => import( './layout.js' ) );
// import Layout from './layout.js';
import IFrame from './iframe.js';
import Button from './button.js';
export default class Home {
  constructor () {
    this.iframe = createRef();
  }
  render () {
    return _( Layout, {},
      _( 'div', { class: "container", style: "margin-top: 100px" },
        _( 'div', { class: "row" },
          _( 'div', { class: "col-lg-12" },
            _( Button ),
            _( 'label', null, "this is test label.." ),
          ),
          _( 'div', { class: "col-lg-12" },
            _( 'br' ),
            _( IFrame )
          ),
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
    onSetup( () => {
      console.log( 'call on setup' + this.constructor.name );
    } );
  }
}
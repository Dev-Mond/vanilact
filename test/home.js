import { createElement as _, lazy, useState, createRef, useEffect } from './dist/vanilact.js';
// const Layout = lazy( () => import( './layout.js' ) );
import Layout from './layout.js';
import IFrame from './iframe.js';
import Button from './button.js';
export default function Home () {
  const ref = createRef();
  const [ rerender, triggerRerender ] = useState( 0 );
  useEffect( () => {
    const timeout = setTimeout( () => {
      triggerRerender( () => 1 );
    }, 1000 );
    return () => clearTimeout( timeout );
  }, [ rerender ] );
  return _( Layout, {},
    _( 'div', { class: "container", style: "margin-top: 100px" },
      _( 'div', { class: "row" },
        _( 'div', { class: "col-lg-12" },
          _( Button ),
          _( 'label', { ref: ref }, "this is test label.." ),
        ),
        _( 'div', { class: "col-lg-12" },
          _( 'br' ),
          _( IFrame )
        ),
      )
    )
  );
}
import { createElement as _, lazy, navigate } from './dist/vanilact.js';
// const Layout = lazy( () => import( './layout.js' ) );
import Layout from './layout.js';
import IFrame from './iframe.js';
import Button from './button.js';
export default function Home () {
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
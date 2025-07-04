import { createElement as _, Fragment } from './dist/vanilact.js';
export default function Layout ( { children } ) {
  console.log( children );
  return _( Fragment, {},
    _( 'div', { class: "container" },
      _( 'div', { class: "row" },
        _( 'div', { class: "col-lg-12" },
          ...children
        )
      ),
    )
  );
}
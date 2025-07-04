import { createElement as _ } from './dist/vanilact.js';
export default function About () {
  return _( 'div', { class: "container" },
    _( 'div', { class: "row" },
      _( 'div', { class: "col-lg-12" },
        _( 'h1', {}, 'Hello World About' )
      )
    ),
  );
}
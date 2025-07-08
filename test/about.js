import { createElement as _, useState } from './dist/vanilact.js';
export default function About () {
  const [ count, setCount ] = useState( 0 );
  return _( 'div', { class: "container" },
    _( 'div', { class: "row" },
      _( 'div', { class: "col-lg-12" },
        _( 'h1', {}, 'Hello World About' ),
        _( 'button', { class: "clicker", onclick: () => setCount( count + 1 ) }, 'Clicker ' + count ),
      )
    ),
  );
}
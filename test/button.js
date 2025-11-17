import { createElement as _, useState } from './dist/vanilact.js';
export default function Button () {
    const [ count, setCount ] = useState( 0 );
    return _( 'button', { class: "clicker", onclick: () => setCount( prev => prev + 1 ) }, 'Clicker ' + count );
}
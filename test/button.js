import { createElement as _, useState, onSetup } from './dist/vanilact.js';
export default function Button () {
    const [ count, setCount ] = useState( 0 );
    onSetup( () => {
        console.log( 'call on setup Button' );
    } );
    return _( 'button', { class: "clicker", onclick: () => setCount( count + 1, this ) }, 'Clicker ' + count );
}
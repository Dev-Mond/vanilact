import { createElement as _, onSetup } from './dist/vanilact.js';
export default function IFrame () {
    onSetup( () => {
        console.log( 'call on setup IFrame' );
    } );
    return _( 'iframe', { ref: this.iframe, width: "1000px", height: "700px", class: 'iframe', src: "#" } );
}
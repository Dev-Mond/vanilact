import { createElement as _ } from './dist/vanilact.js';
export default function IFrame () {
    return _( 'iframe', { width: "1000px", height: "700px", class: 'iframe', src: "https://example.com" } );
}
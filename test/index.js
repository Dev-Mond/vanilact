import { createApp, createElement as _ } from '../dist/vanilact.js';
createApp(
    document.getElementById( 'app' )
).render( function () {
    return _( 'div', { class: "container" },
        _( 'div', { class: "row" },
            _( 'div', { class: "col-lg-12" },
                _( 'h1', {}, 'Hello World' )
            )
        ),
    )
} ); 

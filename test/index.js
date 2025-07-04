import { createApp, createElement as _, lazy } from './dist/vanilact.js';
const App = lazy( () => import( './app.js' ) );
createApp( document.getElementById( 'root' ) )
    .render( App ); 

import { createElement as _, Router, lazy } from '../dist/vanilact.js';
const Home = lazy( () => import( './home.js' ) );
const About = lazy( () => import( './about.js' ) );
// import Home from './home.js';
// import About from './about.js';
export default function App () {
    return _( Router, {
        routes: [
            { path: "/", component: Home },
            { path: "/about", component: About },
            { path: "*", component: () => _( 'h1', null, 'Not Found' ) }
        ],
    } );
    // return _( Home );
}
import { createElement as _, Router, lazy, navigate, useState } from '../dist/vanilact.js';
const Home = lazy( () => import( './home.js' ) );
const About = lazy( () => import( './about.js' ) );
export default class App {
    constructor() {
        [ this.count, this.setCount ] = useState( 0 );
    }
    render () {
        return _( Router, {
            routes: [
                { path: "/", component: Home },
                { path: "/about", component: About },
                { path: "*", component: () => _( 'h1', null, 'Not Found' ) }
            ],

        } );
    }
    willMount () {
        console.log( 'mounting...' )
    }
    onMount () {
        console.log( 'mounted...' )
    }
}
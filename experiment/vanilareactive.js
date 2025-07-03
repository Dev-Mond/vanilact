let currentComponent = null;
let hookIndex = 0;
const appInstance = { type: App, props: {}, hooks: [] };

function createElement ( type, props = {}, ...children ) {
    return { type, props: { ...props, children } };
}

function useState ( initialValue ) {
    const hooks = currentComponent.hooks || ( currentComponent.hooks = [] );
    if ( hooks[ hookIndex ] === undefined ) hooks[ hookIndex ] = initialValue;

    const index = hookIndex;
    const setState = newValue => {
        hooks[ index ] = newValue;
        rerender();
    };

    return [ hooks[ hookIndex++ ], setState ];
}

function useEffect ( callback, deps ) {
    const hooks = currentComponent.hooks || ( currentComponent.hooks = [] );
    const prev = hooks[ hookIndex ];

    const hasChanged = !prev || !deps || deps.some( ( d, i ) => d !== prev.deps[ i ] );

    if ( hasChanged ) {
        hooks[ hookIndex ] = { callback, deps, cleanup: null };
        currentComponent.effects ||= [];
        currentComponent.effects.push( hookIndex ); // save index to run later
    }

    hookIndex++;
}

function runEffects ( component ) {
    const hooks = component.hooks;
    const indices = component.effects || [];

    for ( const i of indices ) {
        const effect = hooks[ i ];
        if ( effect.cleanup ) effect.cleanup(); // Clean up previous
        const cleanup = effect.callback();
        if ( typeof cleanup === 'function' ) {
            effect.cleanup = cleanup;
        }
    }

    component.effects = []; // clear for next render cycle
}

function render ( vnode, container ) {
    if ( typeof vnode === 'string' || typeof vnode === 'number' ) {
        return document.createTextNode( String( vnode ) );
    }
    if ( typeof vnode.type === 'function' ) {
        // Handle functional components
        const componentVNode = vnode.type( vnode.props || {} );
        return render( componentVNode );
    }
    const dom = document.createElement( vnode.type );
    const props = vnode.props || {};

    // Set attributes and event listeners
    for ( const [ key, value ] of Object.entries( props ) ) {
        if ( key == 'ref' ) {
            if ( typeof value === 'function' ) {
                value( dom );
            } else if ( typeof value === 'object' && value !== null && 'current' in value ) {
                value.current = dom;
            }
        }
        else if ( key.startsWith( 'on' ) && typeof value === 'function' ) {
            dom.addEventListener( key.slice( 2 ).toLowerCase(), value );
        } else if ( key !== 'children' ) {
            dom.setAttribute( key, value );
        }
    }

    const children = [].concat( props.children || [] );
    children.forEach( child => {
        const childNode = render( child );
        if ( childNode ) dom.appendChild( childNode );
    } );

    if ( container ) container.appendChild( dom );
    return dom;
}

function renderComponent ( component, container ) {
    currentComponent = component;
    hookIndex = 0;
    const output = component.type( component.props );
    render( output, container );
    runEffects( component );
}

function rerender () {
    const container = document.getElementById( 'root' );
    container.innerHTML = '';
    renderComponent( appInstance, container );
}

function useLocation () {
    const [ loc, setLoc ] = useState( () => location.hash.slice( 1 ) || '/' );

    useEffect( () => {
        const onChange = () => setLoc( location.hash.slice( 1 ) || '/' );
        window.addEventListener( 'hashchange', onChange );

        return () => window.removeEventListener( 'hashchange', onChange );
    }, [] );

    return loc;
}

function navigate ( path ) {
    location.hash = path;
}

function lazy ( importFn ) {
    let LoadedComponent = null;
    let loading = false;
    let error = null;

    return function LazyWrapper ( props ) {
        const [ _, forceUpdate ] = useState( 0 );

        if ( !LoadedComponent && !loading ) {
            loading = true;

            importFn()
                .then( module => {
                    LoadedComponent = module.default;
                    forceUpdate( x => x + 1 ); // trigger re-render once loaded
                } )
                .catch( err => {
                    error = err;
                    forceUpdate( x => x + 1 );
                } );
        }

        if ( error ) {
            return createElement( 'div', null, 'Failed to load component' );
        }

        if ( !LoadedComponent ) {
            return createElement( 'div', null, '⏳ Loading...' );
        }

        return createElement( LoadedComponent, props );
    };
}

function matchRoute ( pathname, routePattern ) {
    const pathParts = pathname.split( '/' ).filter( Boolean );
    const routeParts = routePattern.split( '/' ).filter( Boolean );

    if ( pathParts.length !== routeParts.length ) return null;

    const params = {};

    for ( let i = 0; i < pathParts.length; i++ ) {
        if ( routeParts[ i ].startsWith( ':' ) ) {
            const key = routeParts[ i ].slice( 1 );
            params[ key ] = pathParts[ i ];
        } else if ( pathParts[ i ] !== routeParts[ i ] ) {
            return null;
        }
    }

    return params;
}

function Router ( { routes } ) {
    const pathname = location.hash.slice( 1 ) || '/';

    for ( const [ pattern, Component ] of Object.entries( routes ) ) {
        const params = matchRoute( pathname, pattern );
        if ( params ) {
            return createElement( Component, { params } );
        }
    }

    const fallback = routes[ '*' ] || ( () => createElement( 'h1', null, '404 Not Found' ) );
    return createElement( fallback );
}


//________________________________________________________________________________________________//

function App () {
    const [ count, setCount ] = useState( 0 );

    return createElement(
        'div',
        null,
        createElement( 'h2', null, 'Count: ', count ),
        createElement(
            'button',
            { onclick: () => setCount( count + 1 ) },
            'Increment'
        )
    );
}

// Kick off the first render
rerender();


// function Router ( { routes } ) {
//     const path = location.hash.slice( 1 );
//     const route = routes[ path ] || routes[ '*' ];
//     return route();
// }

// // Usage
// function Home () { return createElement( 'h1', null, 'Home' ); }
// function About () { return createElement( 'h1', null, 'About' ); }

// function App () {
//     return createElement(
//         Router,
//         { routes: { '': Home, about: About, '*': () => createElement( 'h1', null, 'Not Found' ) } }
//     );
// }

createElement( Router, {
    routes: {
        '/': Home,
        '/about': About,
        '/user/:id': UserProfile,
        '*': () => createElement( 'h1', null, 'Not Found' )
    }
} );
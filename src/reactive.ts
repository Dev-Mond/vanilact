/**
 * Component schema
 */
type Component = { type: any, props?: {} | null, hooks?: any[]; effects?: any[]; };
/**
 * Current component instance
 */
let currentComponent: Component;
/**
 * Renderer hook, to identify if rerender have to occur.
 */
let hookIndex = 0;
/**
 * Main app instance
 */
let appInstance;
/**
 * Root element. HTML element node that is integrated in dom.
 */
let rootElement: HTMLElement;
/**
 * To create renderable component.
 * @param type 
 * @param props 
 * @param children 
 * @returns 
 */
function createElement ( type, props: {} | null = {}, ...children ) {
  return { type, props: { ...props, children } };
}
/**
 * Hook identifier. To be able to manipulate rendering cycle
 * @param initialValue 
 * @returns 
 */
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
/**
 * Extension of state.
 * @param callback 
 * @param deps 
 */
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
/**
 * Post Running of all effects create from last render.
 * @param component 
 */
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
/**
 * Render component to the dom.
 * @param vnode 
 * @param container 
 * @returns 
 */
function render ( vnode, container ) {
  if ( typeof vnode === 'string' || typeof vnode === 'number' ) {
    return document.createTextNode( String( vnode ) );
  }
  if ( typeof vnode.type === 'function' ) {
    // Handle functional components
    const componentVNode = vnode.type( vnode.props || {} );
    return render( componentVNode, container );
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
    const childNode = render( child, dom );
    if ( childNode ) dom.appendChild( childNode );
  } );

  if ( container ) container.appendChild( dom );
  return dom;
}
/**
 * Store and render component and run effects.
 * @param component 
 * @param container 
 */
function renderComponent ( component, container ) {
  currentComponent = component;
  hookIndex = 0;
  const output = component.type( component.props );
  render( output, container );
  runEffects( component );
}
/**
 * Main render function.
 */
function rerender () {
  rootElement.innerHTML = '';
  renderComponent( appInstance, rootElement );
}
/**
 * Location Navigator.
 * To be able to change render whatever the location is change.
 * @returns 
 */
function useLocation () {
  const [ loc, setLoc ] = useState( () => location.hash.slice( 1 ) || '/' );

  useEffect( () => {
    const onChange = () => setLoc( location.hash.slice( 1 ) || '/' );
    window.addEventListener( 'hashchange', onChange );

    return () => window.removeEventListener( 'hashchange', onChange );
  }, [] );

  return loc;
}
/**
 * Change location/URL
 * @param path 
 */
function navigate ( path ) {
  location.hash = path;
}
/**
 * To be able to handle dynamic import.
 * @param importFn 
 * @returns 
 */
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
      return createElement( 'div', null, 'Loading...' );
    }

    return createElement( LoadedComponent, props );
  };
}
/**
 * Change component view based or route
 * @param pathname 
 * @param routePattern 
 * @returns 
 */
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
/**
 * Route component that will be use in component based routing
 * @param param0 
 * @returns 
 */
function Router ( { routes } ) {
  const pathname = location.hash.slice( 1 ) || '/';

  for ( const { pattern, Component } of routes ) {
    const params = matchRoute( pathname, pattern );
    if ( params ) {
      return createElement( Component, { params } );
    }
  }

  const fallback = routes[ '*' ] || ( () => createElement( 'h1', null, '404 Not Found' ) );
  return createElement( fallback );
}
/**
 * Exports
 */
export default {
  createApp: ( root: HTMLElement ) => {
    rootElement = root;
    return {
      render ( component ) {
        appInstance = { type: component, props: {}, hooks: [] };
        rerender();
      }
    };
  },
  createElement,
  useState,
  useEffect,
  useLocation,
  navigate,
  lazy,
  Router,
};
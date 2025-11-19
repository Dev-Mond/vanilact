import { Reference, ComponentElement } from './types';
/**
 * Current component instance
 */
let currentComponent: ComponentElement;
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
 * Monitor infinite call of rerender.
 */
let renderCount = 0;
/**
 * Setup event list, to be able to run setup function before the app render.
 */
let setupEventList: Function[] = [];
const componentStore = new Map();
let nextId = 0;
/**
 * Check if string is an text/html type.
 * @param {*} str 
 * @returns 
 */
export const isHTML = ( str ) => {
  const doc = new DOMParser().parseFromString( str, "text/html" );
  return Array.from( doc.body.childNodes ).some( node => node.nodeType === 1 );
};
/**
 * Check if the element is type of component.
 * @param {*} component 
 * @returns 
 */
export const isClassComponent = ( component ) => {
  return (
    typeof component === 'function' &&
    component.prototype &&
    component.prototype.render
  );
};
/**
 * Render component to the dom.
 * @param vnode 
 * @param container 
 * @returns 
 */
function render ( vnode, container, parentInstance?: any ) {
  let dom: any = null;
  let instance: any = null;
  if ( typeof vnode === 'string' || typeof vnode === 'number' ) {
    if ( typeof vnode === 'string' && isHTML( vnode ) )
      dom = document.createRange().createContextualFragment( vnode );
    else
      dom = document.createTextNode( String( vnode ) );
    if ( container ) container.appendChild( dom );
    parentInstance?.setDom && parentInstance?.setDom( container );
    parentInstance?.onMount && parentInstance?.onMount();
    return dom;
  }
  if ( Array.isArray( vnode ) ) {
    dom = document.createDocumentFragment();
    vnode.forEach( child => {
      const childNode = render( child, dom );
      if ( childNode ) dom.appendChild( childNode );
    } );
    if ( container ) container.appendChild( dom );
    parentInstance?.setDom && parentInstance?.setDom( container );
    parentInstance?.onMount && parentInstance?.onMount();
    return dom;
  }
  if ( typeof vnode.type === 'function' ) {
    if ( isClassComponent( vnode.type ) ) {
      instance = new vnode.type( vnode.props || {} );
      vnode.instance = instance;
      instance?.willMount && instance?.willMount();
      const componentVNode = instance.render();
      registerComponent( container, vnode, componentVNode );
      dom = render( componentVNode, container, instance );
      parentInstance?.setDom && parentInstance?.setDom( container );
      parentInstance?.onMount && parentInstance?.onMount();
      return dom;
    }
    else {
      const componentVNode = vnode.type( vnode.props || {} );
      dom = render( componentVNode, container, parentInstance );
      registerComponent( container, vnode, dom );
      return dom;
    }
  }
  dom = document.createElement( vnode.type );
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
  instance?.setDom && instance?.setDom( container );
  instance?.onMount && instance?.onMount();
  parentInstance?.setDom && parentInstance?.setDom( container );
  parentInstance?.onMount && parentInstance?.onMount();
  return dom;
}
/**
 * Store and render component and run effects.
 * @param component 
 * @param container 
 */
function renderComponent ( component, container ) {
  currentComponent = component;
  componentStore.clear();
  hookIndex = 0;
  nextId = 0;
  let output = null;
  let instance = null;
  if ( isClassComponent( component.type ) ) {
    instance = new component.type( component.props );
    component.instance = instance;
    ( instance as any )?.willMount && ( instance as any )?.willMount();
    output = ( instance as any ).render();
  }
  else {
    output = component.type( component.props );
  }
  registerComponent( container, component, output );
  render( output, container, instance );
  runEffects( component );
}
/**
 * Main render function.
 */
function rerender () {
  if ( renderCount++ > 100 ) throw new Error( "Too many rerenders!" );
  rootElement.innerHTML = '';
  renderComponent( appInstance, rootElement );
  if ( setupEventList && setupEventList.length > 0 ) {
    for ( const fn of setupEventList ) {
      if ( typeof fn === 'function' ) {
        try {
          fn();
        } catch ( e ) {
          console.error( ( e as any ).stack );
        }
      }
    }
    setupEventList = [];
  }
  renderCount = 0;
}
/**
 * Change component view based or route
 * @param pathname 
 * @param routePattern 
 * @returns 
 */
function matchRoute ( pathname, routePattern ) {
  const pathParts = pathname.split( '/' ).filter( e => e );
  const routeParts = routePattern.split( '/' ).filter( e => e );

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
 * Register component instance to the store.
 * @param container 
 * @param instance 
 * @returns 
 */
function registerComponent ( container, componentNode, dom ) {
  const id = nextId++;
  componentStore.set( id, { container, componentNode } );
  componentNode.container = container;
  componentNode.__id = id;
  componentNode.__dom = dom;
  return id;
}
/**
 * Hook identifier. To be able to manipulate rendering cycle
 * @param initialValue 
 * @returns 
 */
export function useState ( initialValue ) {
  const hooks = currentComponent.hooks || ( currentComponent.hooks = [] );
  if ( hooks[ hookIndex ] === undefined ) hooks[ hookIndex ] = initialValue;

  const index = hookIndex;
  const setState = ( newValue ) => {
    if ( hooks[ index ] !== newValue ) {
      hooks[ index ] = newValue;
      rerender();
    }
  };

  return [ hooks[ hookIndex++ ], setState ];
}
/**
 * Extension of state.
 * @param callback 
 * @param deps 
 */
export function useEffect ( callback, deps ) {
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
 * To create renderable component.
 * @param type 
 * @param props 
 * @param children 
 * @returns 
 */
export function createElement ( type, props: {} | null = {}, ...children ) {
  return { type, props: { ...props, children } };
}
/**
 * Location Navigator.
 * To be able to change render whatever the location is change.
 * @returns 
 */
export function useLocation () {
  const [ loc, setLoc ] = useState( () => location.pathname );

  useEffect( () => {
    const onChange = () => setLoc( location.pathname );
    window.addEventListener( 'popstate', onChange );

    return () => window.addEventListener( 'popstate', onChange );
  }, [] );

  return loc;
}
/**
 * Change location/URL
 * @param path 
 */
export function navigate ( path, params = {} ) {
  let arrParams: string[] = [];
  if ( params ) {
    Object.entries( params ).map( ( [ k, v ] ) => {
      arrParams.push( `${ encodeURIComponent( decodeURIComponent( k ) ) }=${ encodeURIComponent( decodeURIComponent( v as string ) ) }` );
    } );
  }
  history.pushState( {}, '', [ path, arrParams.filter( e => e ).join( "&" ) ].filter( e => e ).join( "?" ) );
  rerender();
}
/**
 * To be able to handle dynamic import.
 * @param importFn 
 * @returns 
 */
export function lazy ( importFn ) {
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
      console.error( ( error as any ).stack );
      return createElement( 'div' );
    }

    if ( !LoadedComponent ) {
      return createElement( 'div' );
    }

    return createElement( LoadedComponent, props, ...( props.children || [] ) );
  };
}
/**
 * Route component that will be use in component based routing
 * @param param0 
 * @returns 
 */
export function Router ( { routes, errorViews = [] } ) {
  const pathname = location.pathname || '/';
  for ( const { path, component, middlewares } of routes ) {
    const params = matchRoute( pathname, path );
    if ( params ) {
      if ( middlewares && middlewares.length > 0 ) {
        for ( const fn of ( middlewares || [] ) ) {
          if ( typeof fn === 'function' && !( fn() ) ) {
            let fallback401: any = errorViews?.find( s => ( s as any ).statusCode === 401 );
            if ( !fallback401 ) {
              fallback401 = {
                component: ( () =>
                  createElement( 'center', { style: "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)" },
                    createElement( 'h1', null, '401 Access Denied' )
                  )
                )
              };
            }
            return createElement( fallback401.component, fallback401.props );
          }
        }
      }
      return createElement( component, { params } );
    }
  }
  let fallback404: any = errorViews?.find( s => ( s as any ).statusCode === 404 );
  if ( !fallback404 ) {
    fallback404 = {
      component: ( () =>
        createElement( 'center', { style: "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)" },
          createElement( 'h1', null, '404 Not Found' )
        )
      )
    };
  }
  return createElement( fallback404.component, fallback404.props );
}
/**
 * Entry point
 */
export function createApp ( root: HTMLElement ) {
  rootElement = root;
  return {
    render ( component ) {
      appInstance = { type: component, props: {}, hooks: [] };
      rerender();
      window.addEventListener( 'popstate', rerender );
    }
  };
}

/**
 * Component based to identify what is being used in render function.
 */
export class IComponent {
  /**
   * Store the parent node element.
   */
  dom: any;
  /**
   * Entry point
   */
  constructor () { this.dom = null; }
  /**
   * Set the parent node element.
   * @param dom 
   */
  setDom ( dom ) { this.dom = dom; }
  /**
   * Get the dom or the specific element from the dom children
   * This method use querySelector in finding the element.
   * @param selector 
   * @returns 
   */
  getDom ( selector ) {
    if ( selector ) return this.dom.querySelector( selector );
    return this.dom;
  }
  /**
   * Return an array of element that is matched to the selector parameter given.
   * This method use querySelectorAll in finding all the matched elements.
   * @param selector 
   * @returns 
   */
  getDomAll ( selector ) { return this.dom.querySelectorAll( selector ); }
  /**
   * Will be called before the render occur.
   */
  willMount () { }
  /**
   * Mounting template to DOM container
   */
  render () { }
  /**
   * Will be called after the render.
   */
  onMount () { }
}
/**
 * Create reference object of the element
 * @param initial 
 * @returns 
 */
export const createRef = ( initial = null ) => {
  let ref: Reference = { current: initial };
  return ref;
};
/**
 * Handle scenario that you don't have to add tag as a parent node
 * and you have a numnber of childrens
 * @param param0 
 * @returns 
 */
export const Fragment = ( { children } ) => children;
/**
 * Call after the renderer is completed.
 * @param fn 
 */
export const onSetup = ( fn: Function ) => {
  if ( typeof fn === 'function' ) {
    setupEventList.push( fn );
  }
};
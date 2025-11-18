/**
 * Refresent the virtual DOM
 */
interface VNode {
  type: string | Function | symbol;
  props: {
    [ key: string ]: any;
    children: VNode[];
    ref?: { current: any };
  };
}

/**
 * Internal fiber structure for reconciliation
 */
interface Fiber {
  type?: string | Function | symbol;
  props: { [ key: string ]: any; children: VNode[]; ref?: { current: any }; };
  dom?: HTMLElement | Text | DocumentFragment | null | undefined;
  parent?: Fiber | null | undefined;
  child?: Fiber | null | undefined;
  sibling?: Fiber | null | undefined;
  alternate?: Fiber | null | undefined;
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION";
  hooks?: Hook[];
  instance?: IComponent | null;
}

/**
 * Hook for useState
 */
interface Hook {
  state?: any;
  queue?: ( ( state: any ) => any )[];
  deps?: any[];
  cleanup?: () => void;
  ref?: { current: any };
}

/**
 * Global variables
 */
let nextUnitOfWork: Fiber | null = null;
let currentRoot: Fiber | null = null;
let wipRoot: Fiber | null = null;
let deletions: Fiber[] = [];
let wipFiber: Fiber | null = null;
let hookIndex: number = 0;
let pendingEffects: ( () => void )[] = [];
let rootComponent: VNode | null;
let rootContainer: HTMLElement;
let idleCallbackId: number | null = null;

/**
 * Check if key is an event
 * @param key 
 * @returns 
 */
const isEvent = ( key: string ): boolean => key.startsWith( "on" );
/**
 * Check if key is a property
 * @param key 
 * @returns 
 */
const isProperty = ( key: string ): boolean => key !== "children" && key !== "ref" && !isEvent( key );
/**
 * Check if the property or attribute is new
 * @param prev 
 * @param next 
 * @returns 
 */
const isNew = ( prev: { [ key: string ]: any; }, next: { [ key: string ]: any; } ) => ( key: string ): boolean => prev[ key ] !== next[ key ];
/**
 * Check if the property or attribute is removed
 * @param prev 
 * @param next 
 * @returns 
 */
const isGone = ( prev: { [ key: string ]: any; }, next: { [ key: string ]: any; } ) => ( key: string ): boolean => !( key in next );
/**
 * Use to create fragment node.
 */
const Fragment = Symbol( 'react.fragment' );

/**
 * Check if obj is VNode
 * @param obj 
 * @returns 
 */
const isVNode = ( obj: any ): obj is VNode => {
  return typeof obj === 'object' && obj !== null && 'type' in obj && 'props' in obj;
}

/**
 * Check if obj is a function
 * @param obj 
 * @returns 
 */
const isFunctionComponent = ( obj: any ): obj is Function => {
  return typeof obj === 'function' && !( obj.prototype && obj.prototype.render );
}

/**
 * Check if obj is a class component
 * @param obj 
 * @returns 
 */
const isClassComponent = ( obj: any ): obj is IComponent => {
  return typeof obj === 'function' && obj.prototype && typeof obj.prototype.render === 'function';
}

/**
 * Check if string is html
 * @param str 
 * @returns 
 */
const isHTML = ( str ) => {
  const doc = new DOMParser().parseFromString( str, "text/html" );
  return Array.from( doc.body.childNodes ).some( ( node ) => node.nodeType === 1 );
};

/**
 * Class Component Interface
 */
class IComponent {
  props: any;
  state: any;
  _fiber: Fiber | null = null;

  constructor( props: any ) {
    this.props = props;
    this.state = {};
  }

  setState ( partialState: any ) {
    this.state = { ...this.state, ...partialState };
    wipRoot = {
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  forceUpdate () {
    wipRoot = {
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  render (): VNode | null {
    return null;
  }

  onMount () { }
  onUpdate () { }
  onUnmount () { }
}

/**
 * Create VNode object
 * @param type 
 * @param props 
 * @param children 
 * @returns 
 */
function createElement ( type: string | Function | symbol, props: { [ key: string ]: any; } | null, ...children: ( VNode | string | number )[] ): VNode {
  if ( typeof type === 'string' && isHTML( type ) ) {
    return {
      type: 'RAW_HTML',
      props: {
        dangerouslySetInnerHTML: { __html: type },
        children: []
      }
    };
  }

  return {
    type,
    props: {
      ...props,
      children: children.map( child =>
        typeof child === "object"
          ? child
          : createTextElement( child )
      ),
    },
  };
}

/**
 * Create VNode object that handles string
 * @param text 
 * @returns 
 */
function createTextElement ( text: string | number ): VNode {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/**
 * Create DOM element
 * @param fiber 
 * @returns 
 */
function createDom ( fiber: Fiber ): HTMLElement | Text | DocumentFragment {
  if ( fiber.type === 'RAW_HTML' ) {
    return document.createRange().createContextualFragment( fiber.props.dangerouslySetInnerHTML.__html );
  }

  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode( "" )
      : document.createElement( fiber.type as string );

  updateDom( dom, {}, fiber.props );

  return dom;
}

/**
 * Update dom element attribute
 * @param dom 
 * @param prevProps 
 * @param nextProps 
 */
function updateDom ( dom: HTMLElement | Text | DocumentFragment, prevProps: { [ key: string ]: any; }, nextProps: { [ key: string ]: any; } ): void {
  const normalizedNextProps = { ...nextProps };
  if ( normalizedNextProps.class ) {
    normalizedNextProps.className = normalizedNextProps.class;
    delete normalizedNextProps.class;
  }
  // Remove old or changed event listeners
  Object.keys( prevProps )
    .filter( isEvent )
    .filter(
      ( key: string ) =>
        !( key in normalizedNextProps ) ||
        isNew( prevProps, normalizedNextProps )( key )
    )
    .forEach( ( name: string ) => {
      const eventType = name.toLowerCase().substring( 2 );
      dom.removeEventListener(
        eventType,
        prevProps[ name ]
      );
    } );

  // Remove old properties
  Object.keys( prevProps )
    .filter( isProperty )
    .filter( isGone( prevProps, normalizedNextProps ) )
    .forEach( ( name: string ) => {
      if ( name.includes( '-' ) ) {
        ( dom as HTMLElement ).removeAttribute( name );
      } else if ( name === 'className' ) {
        ( dom as HTMLElement ).className = '';
      } else {
        ( dom as any )[ name ] = '';
      }
    } );

  // Set new or changed properties
  Object.keys( normalizedNextProps )
    .filter( isProperty )
    .filter( isNew( prevProps, normalizedNextProps ) )
    .forEach( ( name: string ) => {
      if ( name.includes( '-' ) ) {
        ( dom as HTMLElement ).setAttribute( name, normalizedNextProps[ name ] );
      } else if ( name === 'style' && typeof normalizedNextProps[ name ] === 'object' ) {
        Object.assign( ( dom as HTMLElement ).style, normalizedNextProps[ name ] );
      } else {
        ( dom as any )[ name ] = normalizedNextProps[ name ];
      }
    } );

  // Add event listeners
  Object.keys( normalizedNextProps )
    .filter( isEvent )
    .filter( isNew( prevProps, normalizedNextProps ) )
    .forEach( ( name: string ) => {
      const eventType = name.toLowerCase().substring( 2 );
      dom.addEventListener(
        eventType,
        normalizedNextProps[ name ]
      );
    } );
}

/**
 * Mount the virtual dom to the dom
 */
function commitRoot (): void {
  deletions.forEach( commitWork );
  commitWork( wipRoot!.child! );

  // Run pending effects after commit
  pendingEffects.forEach( effect => effect() );
  pendingEffects = [];

  // Call lifecycle methods for class component
  callLifecycleMethods( wipRoot );

  // Reset
  currentRoot = wipRoot;
  wipRoot = null;
}
/**
 * Call class component lifecycle
 * @param fiber 
 * @returns 
 */
function callLifecycleMethods ( fiber: Fiber | null | undefined ) {
  if ( !fiber ) return;
  if ( fiber.instance ) {
    if ( fiber.effectTag === "PLACEMENT" ) {
      fiber.instance.onMount();
    } else if ( fiber.effectTag === "UPDATE" ) {
      fiber.instance.onUpdate();
    }
  }
  callLifecycleMethods( fiber.child );
  callLifecycleMethods( fiber.sibling );
}

/**
 * Apply the effect tag or render and update nodes
 * @param fiber 
 * @returns 
 */
function commitWork ( fiber: Fiber | null | undefined ): void {
  if ( !fiber ) {
    return;
  }

  let domParentFiber: Fiber = fiber.parent!;
  while ( !domParentFiber.dom ) {
    domParentFiber = domParentFiber.parent!;
  }
  const domParent = domParentFiber.dom!;

  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild( fiber.dom );
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate!.props,
      fiber.props
    );
  } else if ( fiber.effectTag === "DELETION" ) {
    if ( fiber.instance ) {
      fiber.instance.onUnmount?.();
    }
    commitDeletion( fiber, domParent );
  }

  commitWork( fiber.child );
  commitWork( fiber.sibling );
}

/**
 * Remove all queued element or attribute
 * @param fiber 
 * @param domParent 
 */
function commitDeletion ( fiber: Fiber, domParent: HTMLElement | Text | DocumentFragment ): void {
  if ( fiber.dom ) {
    domParent.removeChild( fiber.dom );
  } else {
    commitDeletion( fiber.child!, domParent );
  }
}

/**
 * Signal requestIdleCallback execute the work.
 * @param element 
 * @param container 
 */
function render ( element: VNode, container: HTMLElement ): void {
  wipRoot = {
    dom: container,
    props: {
      children: [ element ],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

/**
 * Render loop.
 * @param deadline 
 */
function workLoop ( deadline: IdleDeadline ): void {
  let shouldYield = false;
  while ( nextUnitOfWork && !shouldYield ) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    );
    shouldYield = deadline.timeRemaining() < 1;
  }

  if ( !nextUnitOfWork && wipRoot ) {
    commitRoot();
  }

  requestIdleCallback( workLoop );
}

/**
 * Render each fiber without blocking the thread process
 * @param fiber 
 * @returns 
 */
function performUnitOfWork ( fiber: Fiber ): Fiber | null {
  const isFunctionComponent =
    typeof fiber.type === "function";
  if ( isFunctionComponent ) {
    if ( ( fiber.type as Function ).prototype instanceof IComponent ) {
      updateClassComponent( fiber );
    } else {
      updateFunctionComponent( fiber );
    }
  } else if ( fiber.type === Fragment ) {
    updateFragmentComponent( fiber );
  } else {
    updateHostComponent( fiber );
  }
  if ( fiber.child ) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while ( nextFiber ) {
    if ( nextFiber.sibling ) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent!;
  }
  return null;
}

/**
 * Start requestIdleCallback loop.
 */
function startWorkLoop () {
  idleCallbackId = requestIdleCallback( workLoop );
}

/**
 * Update function component
 * @param fiber 
 */
function updateFunctionComponent ( fiber: Fiber ): void {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [ typeof fiber.type === 'function' ? fiber.type( fiber.props ) : null ].filter( e => e );
  reconcileChildren( fiber, children );
}

/**
 * Update class component
 * @param fiber 
 */
function updateClassComponent ( fiber: Fiber ): void {
  const ComponentClass = fiber.type as any;
  if ( fiber.alternate && fiber.alternate.instance ) {
    fiber.instance = fiber.alternate.instance;
    fiber.instance.props = fiber.props;
    fiber.instance._fiber = fiber;
  } else {
    fiber.instance = new ComponentClass( fiber.props );
    fiber.instance!._fiber = fiber;
  }

  const children = [ fiber.instance!.render() ].filter( e => e ) as VNode[];
  reconcileChildren( fiber, children );
}

/**
 * Update fragment
 * @param fiber 
 */
function updateFragmentComponent ( fiber: Fiber ): void {
  reconcileChildren( fiber, fiber.props.children );
}

/**
 * Call rerender action and update data.
 * @param initial 
 * @returns 
 */
function useState<T> ( initial: T ): [ T, ( action: ( state: T ) => T ) => void ] {
  const oldHook =
    wipFiber!.alternate &&
    wipFiber!.alternate.hooks &&
    wipFiber!.alternate.hooks[ hookIndex ];
  const hook: Hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions!.forEach( ( action: ( state: any ) => any ) => {
    hook.state = action( hook.state );
  } );

  const setState = ( action: ( state: T ) => T ) => {
    hook.queue!.push( action );
    wipRoot = {
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber!.hooks!.push( hook );
  hookIndex++;
  return [ hook.state, setState ];
}

/**
 * Update parent component
 * @param fiber 
 */
function updateHostComponent ( fiber: Fiber ): void {
  if ( !fiber.dom ) {
    fiber.dom = createDom( fiber );
  }
  if ( fiber?.props?.ref ) {
    fiber.props.ref.current = fiber.dom;
  }
  reconcileChildren( fiber, fiber.props.children );
}

/**
 * Update VNode children
 * @param wipFiber 
 * @param elements 
 */
function reconcileChildren ( wipFiber: Fiber, elements: VNode[] ): void {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber | null = null;

  while ( index < elements.length || oldFiber != null ) {
    const element = elements[ index ];
    let newFiber: Fiber | null = null;

    const sameType =
      oldFiber &&
      element &&
      element.type === oldFiber.type;

    if ( sameType ) {
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if ( element && !sameType ) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if ( oldFiber && !sameType ) {
      oldFiber.effectTag = "DELETION";
      deletions.push( oldFiber );

      if ( index === 0 ) {
        wipFiber.child = null;
      } else if ( prevSibling ) {
        prevSibling.sibling = null;
      }
    }

    if ( oldFiber ) {
      oldFiber = oldFiber.sibling;
    }

    if ( index === 0 ) {
      wipFiber.child = newFiber;
    } else if ( element ) {
      prevSibling!.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

/**
 * Check if previous value is the same to the new value.
 * @param a 
 * @param b 
 * @returns 
 */
function depsEqual ( a: any[], b: any[] ): boolean {
  if ( a.length !== b.length ) return false;
  return a.every( ( val, i ) => val === b[ i ] );
}

/**
 * Run post action or callback
 * @param effect 
 * @param deps 
 */
function useEffect ( effect: () => void | ( () => void ), deps: any[] ): void {
  const oldHook =
    wipFiber!.alternate &&
    wipFiber!.alternate.hooks &&
    wipFiber!.alternate.hooks[ hookIndex ];
  const hasChanged = !oldHook || !depsEqual( oldHook.deps!, deps );
  const hook: Hook = {
    deps,
    cleanup: oldHook?.cleanup,
  };
  wipFiber!.hooks!.push( hook );
  if ( hasChanged ) {
    if ( oldHook?.cleanup ) {
      oldHook.cleanup!();
    }
    pendingEffects.push( () => {
      const cleanup = effect();
      if ( typeof cleanup === "function" ) {
        hook.cleanup = cleanup;
      }
    } );
  }
  hookIndex++;
}

/**
 * Load component asyncronously
 * @param loader 
 * @returns 
 */
function lazy ( loader: () => Promise<any> ): Function {
  return function LazyComponent ( props: any ) {
    const [ Component, setComponent ] = useState<any>( null );
    useEffect( () => {
      loader().then( ( module ) => {
        setComponent( prev => prev = module.default || module );
      } );
    }, [] );
    if ( !Component ) {
      return createElement( "div", null, "" );
    }
    return createElement( Component, props );
  };
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
 * Route component that will be use in component based routing
 * @param param0 
 * @returns 
 */
function Router ( { routes, errorViews = [] }: { routes: { path: string; component: Function, middlewares: ( () => boolean )[] }[], errorViews: { path: string; component: Function }[] } ) {
  const currentPath = window.location.pathname
  for ( const { path, component, middlewares } of routes ) {
    const params = matchRoute( currentPath, path );
    if ( params ) {
      if ( middlewares && middlewares.length > 0 ) {
        for ( const fn of ( middlewares || [] ) ) {
          if ( typeof fn === 'function' && !( fn() ) ) {
            let fallback401: any = errorViews?.find( s => ( s as any ).statusCode === 401 );
            if ( !fallback401 ) {
              fallback401 = {
                component: ( () =>
                  createElement( 'center', { style: "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)" },
                    createElement( 'h1', {}, '401 Access Denied' )
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
          createElement( 'h1', {}, '404 Not Found' )
        )
      )
    };
  }
  return createElement( fallback404.component, fallback404.props );
}

/**
 * Trigger change of page event
 * @param to 
 * @param params 
 */
function navigate ( to, params = {} ) {
  let arrParams: string[] = [];
  if ( params ) {
    Object.entries( params )
      .map( ( [ k, v ] ) => {
        arrParams.push(
          `${ encodeURIComponent( decodeURIComponent( k ) ) }=${ encodeURIComponent( decodeURIComponent( v as string ) ) }`
        );
      } );
  }
  window.history.pushState( {}, '',
    [ to, arrParams.filter( e => e ).join( "&" ) ]
      .filter( e => e )
      .join( "?" )
  );
  window.dispatchEvent( new PopStateEvent( "popstate" ) );
  rerender();
}
/**
 * Rerender whole fiber
 */
function rerender () {
  if ( idleCallbackId !== null ) {
    cancelIdleCallback( idleCallbackId );
    idleCallbackId = null;
  }
  rootContainer.innerHTML = "";
  nextUnitOfWork = null;
  currentRoot = null;
  wipRoot = null;
  deletions = [];
  wipFiber = null;
  hookIndex = 0;
  pendingEffects = [];
  startWorkLoop();
  render( rootComponent!, rootContainer );
}

/**
 * Create reference object of the element
 * @param initial 
 * @returns 
 */
function createRef ( initial = null ) {
  let ref = { current: initial };
  return ref;
};

/**
 * Start app 
 * @param root 
 * @returns 
 */
function createApp ( root ) {
  rootContainer = root;
  return {
    render ( component: VNode | Function | IComponent ) {
      if ( isVNode( component ) )
        rootComponent = component as VNode;
      else
        rootComponent = createElement( component as any, {} );
      window.addEventListener( "popstate", rerender );
      rerender();
    }
  }
}

/**
 * Get the reference of the dom element.
 * @param initialValue 
 * @returns 
 */
function useRef<T> ( initialValue: T ): { current: T } {
  const oldHook =
    wipFiber!.alternate &&
    wipFiber!.alternate.hooks &&
    wipFiber!.alternate.hooks[ hookIndex ];
  const hook: Hook = {
    ref: oldHook ? oldHook.ref : { current: initialValue },
  };
  wipFiber!.hooks!.push( hook );
  hookIndex++;
  return hook.ref!;
}

/**
 * Expose functions.
 */
export {
  createElement,
  useState,
  useEffect,
  lazy,
  Router,
  navigate,
  Fragment,
  createRef,
  createApp,
  render,
  IComponent,
  useRef
};

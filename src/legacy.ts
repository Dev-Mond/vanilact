import hb from 'handlebars';
import { Route, Component, statusCodeComp, Reference } from './types';
/**
 * Globaly available root element.
 */
let rootElement: null | HTMLElement = null;
/**
 * List of avaliable routes
 */
let routes: Route[] = [];
/**
 * Error statuses.
 */
let errorCodes: statusCodeComp[] = [];
/**
 * Default 404 status component
 * @returns 
 */
let Status404 = function () {
    return createElement( 'center', {},
        createElement( 'h2', {},
            404,
            createElement( 'br' ),
            "Page not found."
        )
    );
};
/**
 * Default 403 status component
 * @returns 
 */
let Status403 = function () {
    return createElement( 'center', {},
        createElement( 'h2', {},
            403,
            createElement( 'br' ),
            "Access is Forbidden."
        )
    );
};
/**
 * Entry point for the application.
 * This function creates a new instance of the context
 * and renders the application to the DOM.
 * @param {*} context 
 * @param {*} options 
 * @returns 
 */
export const createApp = ( root: HTMLElement ) => {
    rootElement = root;
    const init = () => {
        window?.addEventListener( 'popstate', renderRoute );
        document?.addEventListener( 'DOMContentLoaded', renderRoute );
        if ( !getStatusCodeComponent( 404 ) )
            setStatusCodeComponent( 404, Status404 );
        if ( !getStatusCodeComponent( 403 ) )
            setStatusCodeComponent( 403, Status403 );
    };
    return {
        render: ( element: HTMLElement, props: any, ...children: any[] ) => {
            if ( routes.length <= 0 ) {
                init();
                render( createElement( element, props, ...children ), root );
            }
        },
        useRoutes: ( routes = [] ) => {
            init();
            createRoutes( routes );
        },
        setStatusCodeComponent: ( code, component, params = {} ) => {
            setStatusCodeComponent( code, component, params );
        }
    };
};
/**
 * Use to create dom element.
 * @param {*} type 
 * @param {*} props 
 * @param  {...any} children 
 * @returns 
 */
export const createElement = ( type: any, props?: any, ...children: any[] ) => {
    return {
        type: type,
        props: {
            ...props,
            children: ( children || [] ).flat().map( ( child ) => [ 'object', 'function' ].includes( typeof child ) ? child : createTextElement( child ) )
        }
    };
};
/**
 * To be able to create text nodes
 * @param {*} text 
 * @returns 
 */
export const createTextElement = ( text ) => {
    return {
        type: isHTML( text ) ? 'FRAGMENT' : 'TEXT_ELEMENT',
        props: { nodeValue: text, children: [] },
    };
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
 * To be able to mount and render our ui.
 * @param {*} element 
 * @param {*} container 
 */
export const render = async ( element, container ) => {
    let { type, props } = element;
    let actualElement = element;
    let instance: Component | null = null;
    let dom: null | Node = null;

    if ( type instanceof Promise ) {
        let result = await type.then();
        type = result.default ?? result;
    }

    if ( typeof type === 'function' ) {

        if ( 'default' in type ) {
            type = type.default ?? type;
        }

        if ( isClassComponent( type ) ) {
            instance = new type( props );
            instance?.willMount && instance?.willMount();
            actualElement = instance?.render();
            if ( actualElement.type instanceof Promise ) {
                actualElement.type = await type.then();
                let r = await actualElement.type.then();
                actualElement.type = r.default ?? r;
            }
        }
        else {
            actualElement = type( props );
        }
    }

    if ( [ 'object' ].includes( typeof actualElement.type ) && "default" in actualElement.type ) {
        actualElement.type = actualElement.type.default;
        await render( actualElement, container );
        return;
    }
    if ( actualElement.type === "TEXT_ELEMENT" )
        dom = document.createTextNode( props.nodeValue );
    else if ( actualElement.type === "FRAGMENT" ) {
        dom = document.createDocumentFragment();
        dom.appendChild( document.createRange().createContextualFragment( props.nodeValue ) );
    }
    else if ( actualElement.type === null || actualElement.type === "" || isClassComponent( actualElement.type ) ) {
        dom = document.createDocumentFragment();
    }
    else
        dom = document.createElement( actualElement.type );

    Object.entries( actualElement.props || {} ).forEach( ( [ name, value ] ) => {
        if ( dom ) {
            if ( name === 'ref' ) {
                ( value as Reference ).current = dom;
            }
            else if ( name === 'class' ) {
                ( dom as Element ).setAttribute( 'class', value as string );
            }
            else if ( name !== 'children' ) {
                dom[ name ] = value;
            }
        }
    } );

    for ( const child of actualElement.props?.children || [] ) {
        await render( child, dom );
    }
    container.append( dom );
    instance?.setDom && instance?.setDom( container );
    instance?.onMount && instance?.onMount();
};

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
 * Compile the Handlebars template with optional data.
 * This is a utility function that can be used to render
 * Handlebars templates with data.
 * It uses the Handlebars compile function to compile the template
 * and then executes it with the provided data.
 * @param {*} html 
 * @param {*} data 
 * @returns 
 */
export const withData = ( html, data ) => {
    return hb.compile( html )( data || {} );
};

/**
 * Change route location or change page.
 * @param {*} path 
 */
export const navigateTo = async ( path ) => {
    history.pushState( {}, '', path );
    await renderRoute();
};

/**
 * Render new page or location
 */
export const renderRoute = async () => {
    if ( routes.length > 0 ) {
        const path = window.location.pathname;
        const { component, params } = await matchRoute( path );
        let resolved = await component;
        rootElement?.replaceChildren();
        render( { type: resolved, props: { params } }, rootElement );
    }
};

/**
 * Find the match component to be render for the route.
 * @param {*} path 
 * @returns 
 */
const matchRoute = async ( path ) => {
    for ( let route of routes ) {
        const paramNames: any[] = [];
        const regexPath = route.path
            .replace( /:[^/]+/g, ( match ) => {
                paramNames.push( match.slice( 1 ) );
                return '([^/]+)';
            } )
            .replace( /\//g, '\\/' );

        const regex = new RegExp( `^${ regexPath }$` );
        const match = path.match( regex );

        if ( match ) {
            const params = {};
            paramNames.forEach( ( key, i ) => {
                params[ key ] = decodeURIComponent( match[ i + 1 ] );
            } );
            if ( route.middlewares && route.middlewares.length > 0 ) {
                for ( const fn of ( route.middlewares || [] ) ) {
                    if ( !( await fn() ) ) {
                        return { component: getStatusCodeComponent( 403 )?.component, params: {} };
                    }
                }
            }
            return { component: route.component, params };
        }
    }
    return { component: getStatusCodeComponent( 404 )?.component, params: {} };
};

/**
 * Render new page or location
 */
export const navigateToAlias = async ( alias, query = {} ) => {
    if ( routes.length > 0 ) {
        const { component, params, path } = await matchAlias( alias, query );
        if ( path )
            history.pushState( {}, '', path );
        let resolved = await component;
        rootElement?.replaceChildren();
        render( { type: resolved, props: { params } }, rootElement );
    }
};

/**
 * Find the match component to be render for the route.
 * @param {*} path 
 * @returns 
 */
const matchAlias = async ( alias, query: Record<string, string> | string ) => {
    for ( let route of routes ) {
        if ( alias === route.alias ) {
            let params: Record<string, string> = {};
            let path = route.path;
            let stringQuery: string[] = [];
            if ( query && typeof query === 'string' ) {
                const queryArr = query.split( "&" );
                queryArr.map( ( param ) => {
                    const [ k, v ] = param.split( '=' );
                    if ( k.trim() )
                        params[ k ] = v;
                } );
            }
            else params = query as Record<string, string>;
            Object.entries( params ).map( ( [ k, v ] ) => {
                if ( k.trim() )
                    stringQuery.push( `${ encodeURIComponent( decodeURIComponent( k ) ) }=${ encodeURIComponent( decodeURIComponent( v ) ) }` );
            } );
            if ( stringQuery.length > 0 ) {
                path += "?" + stringQuery.join( "&" );
            }
            if ( route.middlewares && route.middlewares.length > 0 ) {
                for ( const fn of ( route.middlewares || [] ) ) {
                    if ( !( await fn() ) ) {
                        return { component: getStatusCodeComponent( 403 )?.component, params: {} };
                    }
                }
            }
            return { component: route.component, params, path: path };
        }
    }
    return { component: getStatusCodeComponent( 404 )?.component, params: {} };
};

/**
 * Use to easily create route on runtime.
 * @param {*} path 
 * @param {*} component 
 */
export const createRoute = ( path, component, alias, middlewares = [] ) => {
    routes.push( { path, component, alias, middlewares } );
};

/**
 * Compile all the routes.
 * @param {*} routes Array<{ path: string, component: object }>
 */
export const createRoutes = ( _routes ) => {
    routes = [];
    _routes.map( r => createRoute(
        r.path,
        r.component,
        r.alias,
        r.middlewares )
    );
};

/**
 * Use to easily remove route on runtime.
 * @param {*} path 
 */
export const deleteRoute = ( path ) => {
    routes = routes.filter( e => e.path !== path );
};

/**
 * Set status code component
 * @param component 
 */
export const setStatusCodeComponent = ( code, component, params = {} ) => {
    const status = getStatusCodeComponent( code );
    if ( status )
        status.component = component;
    else
        errorCodes.push( { code, component, params } );
};

/**
 * Get the status code component
 * @param code 
 * @returns 
 */
export const getStatusCodeComponent = ( code ) => {
    return errorCodes.find( c => c.code.toString() === code.toString() );
};

/**
 * Check if component is a class or a function.
 * @param fn 
 * @returns 
 */
export const isConstructable = ( fn ) => {
    try { new fn(); return true; } catch { return false; }
};

/**
 * Component based to identify what is being used in render function.
 */
export class IComponent {
    /**
     * Store the parent node element.
     */
    dom: any;
    /**
     * Variable that is monitored by renderer to identify
     * if the re-render is required.
     * Being reset each setState() function called
     */
    state: { [ key: string ]: any; } = {};
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
import { createElement as _, lazy } from './dist/vanilact.js';
const Layout = lazy( () => import( './layout.js' ) );
// import Layout from './layout.js';
export default function Home () {
  return _( Layout, {}, `Hello World` );
}
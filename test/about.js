import { createElement as _, useState, navigate, IComponent } from './dist/vanilact.js';
import Other from './other.js';
export default class About extends IComponent {
  constructor ( props ) {
    super( props );
    this.state = {
      count: 0,
      loading: false
    }
    this.count = 0;
  }
  handleClick ( e ) {
    navigate( '/' );
  }
  onMount () {
    setTimeout( () => {
      this.setState( { loading: true } );
    }, 5000 );
  }
  onUpdate () {
  }
  onUnmount () {
    console.log( "ON UNMOUNT..." )
  }
  render () {
    return _( 'div', { class: "container" },
      _( 'div', { class: "row" },
        _( 'div', { class: "col-lg-12" },
          _( 'h1', {}, 'Hello World About' ),
          _( 'button', { class: "clicker", onClick: ( e ) => this.handleClick( e ) }, 'Clicker ' + this.state.count + " - " + this.count )
        ),
        _( 'div', { class: "col-lg-12" },
          !this.state.loading ? _( Other ) : "REMOVED"
        )
      ),
    );
  }
  // const [ count, setCount ] = useState( 0 );
  // const [ loading, setLoading ] = useState( false );
  // useEffect( () => {
  //   const timeout = setTimeout( () => {
  //     setLoading( ( prev ) => prev = true );
  //   }, 5000 );
  //   return () => clearTimeout( timeout );
  // }, [] );
  // return _( 'div', { class: "container" },
  //   _( 'div', { class: "row" },
  //     _( 'div', { class: "col-lg-12" },
  //       _( 'h1', {}, 'Hello World About' ),
  //       _( 'button', { class: "clicker", onclick: () => setCount( prev => prev + 1 ) }, 'Clicker ' + count ),
  //       _( 'div', {}, "LOADING: " + loading )
  //     )
  //   ),
  // );
}
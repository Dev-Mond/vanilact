import { createElement as _, useState, useEffect, IComponent, navigate } from './dist/vanilact.js';
export default class Other extends IComponent {
  constructor ( props ) {
    super( props );
    this.state = {
      count: 0,
      loading: false
    }
    this.count = 0;
  }
  render () {
    return _( 'div', { class: "container" },
      _( 'div', { class: "row" },
        _( 'div', { class: "col-lg-12" },
          _( 'h1', {}, 'Hello World Other' )
        )
      ),
    );
  }
}
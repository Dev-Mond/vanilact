import { createElement as _, Fragment } from './dist/vanilact.js';
export default function Layout ( { children } ) {
  console.log( children );
  return _( Fragment, {},
    _( 'div', { class: "fixed-top" },
      _( 'header', { class: "topbar" },
        _( 'div', { class: "container" },
          _( 'div', { class: "col-sm-12" },
            _( 'ul', { class: "social-network" },
              _( 'li', {},
                _( 'a', { class: "waves-effect waves-dark", href: "#" },
                  _( 'i', { class: "fa fa-facebook" } )
                )
              ),
              _( 'li', {},
                _( 'a', { class: "waves-effect waves-dark", href: "#" },
                  _( 'i', { class: "fa fa-twitter" } )
                )
              ),
              _( 'li', {},
                _( 'a', { class: "waves-effect waves-dark", href: "#" },
                  _( 'i', { class: "fa fa-linkedin" } )
                )
              ),
              _( 'li', {},
                _( 'a', { class: "waves-effect waves-dark", href: "#" },
                  _( 'i', { class: "fa fa-pinterest" } )
                )
              ),
              _( 'li', {},
                _( 'a', { class: "waves-effect waves-dark", href: "#" },
                  _( 'i', { class: "fa fa-google-plus" } )
                )
              )
            )
          )
        )
      ),
      _( 'nav', { class: "navbar navbar-expand-lg navbar-dark mx-background-top-linear w-100" },
        _( 'div', { class: "container" },
          _( 'a', { class: "navbar-brand", rel: "nofollow", target: "_blank", }, "DEVMORE" ),
          _( 'button', { class: "navbar-toggler", type: "button", 'data-toggle': "collpse", "data-target": "#navbarResponsive", "aria-controls": "navbarResponsive", "aria-expanded": "false", "aria-label": "Toggle navigation" },
            _( 'span', { class: "navbar-toggler-icon" } )
          ),
          _( 'div', { class: "collapse navbar-collapse", id: "navbarResponsive" },
            _( 'ul', { class: "navbar-nav ml-auto" },
              _( 'li', { class: "nav-item active" },
                _( 'a', { class: "nav-link" },
                  "Home",
                  _( 'span', { class: "sr-only" }, "(current)" )
                )
              ),
              _( 'li', { class: "nav-item" },
                _( 'a', { class: "nav-link", href: "/about" },
                  "About"
                )
              ),
              _( 'li', { class: "nav-item" },
                _( 'a', { class: "nav-link", href: "/fruits" },
                  "Fruits"
                )
              ),
              _( 'li', { class: "nav-item" },
                _( 'a', { class: "nav-link", href: "/seafood" },
                  "Sea Food"
                )
              ),
              _( 'li', { class: "nav-item" },
                _( 'a', { class: "nav-link", href: "/vegetables" },
                  "Vegetables"
                )
              )
            )
          )
        )
      )
    ),
    ...children
  );
}
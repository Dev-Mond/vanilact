const { navigateToAlias } = require( '../src/index' );

test( 'navigateToAlias(login, {name: juan, age: 23}) => []', () => {
  expect( navigateToAlias( 'login', { name: 'juan', age: 23 } ) ).toBe( [] );
} );
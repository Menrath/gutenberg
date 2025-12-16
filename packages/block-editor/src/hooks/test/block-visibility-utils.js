/**
 * Internal dependencies
 */
import {
	isHiddenForViewport,
	hasAnyVisibilitySettings,
	getToggledVisibility,
} from '../block-visibility-utils';

describe( 'block-visibility-utils', () => {
	describe( 'isHiddenForViewport', () => {
		it( 'returns true when blockVisibility is false', () => {
			expect( isHiddenForViewport( false, 'Desktop' ) ).toBe( true );
			expect( isHiddenForViewport( false, 'Tablet' ) ).toBe( true );
			expect( isHiddenForViewport( false, 'Mobile' ) ).toBe( true );
		} );

		it( 'returns true when viewport-specific object has false for the viewport', () => {
			expect( isHiddenForViewport( { mobile: false }, 'Mobile' ) ).toBe(
				true
			);
			expect( isHiddenForViewport( { tablet: false }, 'Tablet' ) ).toBe(
				true
			);
			expect( isHiddenForViewport( { desktop: false }, 'Desktop' ) ).toBe(
				true
			);
		} );

		it( 'returns false when blockVisibility is undefined', () => {
			expect( isHiddenForViewport( undefined, 'Desktop' ) ).toBe( false );
		} );

		it( 'returns false when object has no false values for the viewport', () => {
			expect(
				isHiddenForViewport( { mobile: true, tablet: true }, 'Desktop' )
			).toBe( false );
			expect( isHiddenForViewport( { mobile: false }, 'Tablet' ) ).toBe(
				false
			);
		} );

		it( 'handles case-insensitive viewport types', () => {
			expect( isHiddenForViewport( { mobile: false }, 'MOBILE' ) ).toBe(
				true
			);
			expect( isHiddenForViewport( { tablet: false }, 'Tablet' ) ).toBe(
				true
			);
		} );
	} );

	describe( 'hasAnyVisibilitySettings', () => {
		it( 'returns true when blockVisibility is false', () => {
			expect( hasAnyVisibilitySettings( false ) ).toBe( true );
		} );

		it( 'returns true when object has any false value', () => {
			expect( hasAnyVisibilitySettings( { mobile: false } ) ).toBe(
				true
			);
			expect(
				hasAnyVisibilitySettings( { mobile: true, tablet: false } )
			).toBe( true );
			expect(
				hasAnyVisibilitySettings( {
					mobile: false,
					tablet: false,
					desktop: false,
				} )
			).toBe( true );
		} );

		it( 'returns false when blockVisibility is undefined', () => {
			expect( hasAnyVisibilitySettings( undefined ) ).toBe( false );
		} );

		it( 'returns false when object has no false values', () => {
			expect( hasAnyVisibilitySettings( { mobile: true } ) ).toBe(
				false
			);
			expect(
				hasAnyVisibilitySettings( {
					mobile: true,
					tablet: true,
					desktop: true,
				} )
			).toBe( false );
		} );
	} );

	describe( 'getToggledVisibility', () => {
		describe( 'when showing (isCurrentlyHidden === true)', () => {
			it( 'converts false to object with other viewports hidden', () => {
				const result = getToggledVisibility( false, 'Mobile', true );
				expect( result ).toEqual( {
					desktop: false,
					tablet: false,
				} );
			} );

			it( 'removes viewport key from object', () => {
				const result = getToggledVisibility(
					{ mobile: false, tablet: false },
					'Mobile',
					true
				);
				expect( result ).toEqual( { tablet: false } );
			} );

			it( 'returns undefined when object becomes empty', () => {
				const result = getToggledVisibility(
					{ mobile: false },
					'Mobile',
					true
				);
				expect( result ).toBeUndefined();
			} );

			it( 'returns undefined when currentVisibility is undefined', () => {
				const result = getToggledVisibility(
					undefined,
					'Mobile',
					true
				);
				expect( result ).toBeUndefined();
			} );
		} );

		describe( 'when hiding (isCurrentlyHidden === false)', () => {
			it( 'creates object with viewport set to false from undefined', () => {
				const result = getToggledVisibility(
					undefined,
					'Mobile',
					false
				);
				expect( result ).toEqual( { mobile: false } );
			} );

			it( 'adds viewport key with false to existing object', () => {
				const result = getToggledVisibility(
					{ tablet: false },
					'Mobile',
					false
				);
				expect( result ).toEqual( {
					tablet: false,
					mobile: false,
				} );
			} );

			it( 'simplifies to false when all viewports are hidden', () => {
				const result = getToggledVisibility(
					{ mobile: false, tablet: false },
					'Desktop',
					false
				);
				expect( result ).toBe( false );
			} );

			it( 'handles case-insensitive viewport types', () => {
				const result = getToggledVisibility(
					undefined,
					'MOBILE',
					false
				);
				expect( result ).toEqual( { mobile: false } );
			} );
		} );
	} );
} );

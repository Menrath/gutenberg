/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useBlockVisibility from '../use-block-visibility';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch/use-dispatch', () =>
	jest.fn()
);
jest.mock( '@wordpress/blocks', () => ( {
	hasBlockSupport: jest.fn(),
} ) );
jest.mock( '../../store', () => ( {
	store: {
		name: 'core/block-editor',
	},
} ) );

describe( 'useBlockVisibility', () => {
	const mockUpdateBlockAttributes = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		hasBlockSupport.mockReturnValue( true );
		useDispatch.mockImplementation( () => ( {
			updateBlockAttributes: mockUpdateBlockAttributes,
		} ) );
	} );

	function setupUseSelectMock( overrides = {} ) {
		const defaultBlocks = [
			{
				clientId: 'block-1',
				attributes: {
					metadata: {
						blockVisibility: undefined,
					},
				},
			},
		];

		const defaultSelect = {
			getBlockName: jest.fn( ( clientId ) => `core/block-${ clientId }` ),
			getBlocksByClientId: jest.fn( () => defaultBlocks ),
			getSettings: jest.fn( () => ( {
				__experimentalDeviceType: 'Desktop',
			} ) ),
			...overrides.select,
		};

		useSelect.mockImplementation( ( mapSelect ) => {
			const select = ( store ) => {
				if ( store?.name === 'core/block-editor' ) {
					return defaultSelect;
				}
				return {};
			};
			return mapSelect( select );
		} );
	}

	it( 'returns isHidden as true when any block is hidden for current viewport', () => {
		setupUseSelectMock( {
			select: {
				getBlocksByClientId: jest.fn( () => [
					{
						clientId: 'block-1',
						attributes: {
							metadata: {
								blockVisibility: false,
							},
						},
					},
				] ),
			},
		} );

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.isHidden ).toBe( true );
	} );

	it( 'returns isHidden as false when no blocks are hidden', () => {
		setupUseSelectMock();

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.isHidden ).toBe( false );
	} );

	it( 'returns isHiddenInAnyDevice as true when any block has visibility settings', () => {
		setupUseSelectMock( {
			select: {
				getBlocksByClientId: jest.fn( () => [
					{
						clientId: 'block-1',
						attributes: {
							metadata: {
								blockVisibility: { mobile: false },
							},
						},
					},
				] ),
			},
		} );

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.isHiddenInAnyDevice ).toBe( true );
	} );

	it( 'returns isHiddenInAnyDevice as false when no blocks have visibility settings', () => {
		setupUseSelectMock();

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.isHiddenInAnyDevice ).toBe( false );
	} );

	it( 'returns canToggle as true when all blocks support visibility', () => {
		hasBlockSupport.mockReturnValue( true );
		setupUseSelectMock();

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.canToggle ).toBe( true );
	} );

	it( 'returns canToggle as false when any block does not support visibility', () => {
		hasBlockSupport.mockReturnValue( false );
		setupUseSelectMock();

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.canToggle ).toBe( false );
	} );

	it( 'returns currentViewport from settings', () => {
		setupUseSelectMock( {
			select: {
				getSettings: jest.fn( () => ( {
					__experimentalDeviceType: 'Tablet',
				} ) ),
			},
		} );

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.currentViewport ).toBe( 'Tablet' );
	} );

	it( 'defaults currentViewport to Desktop when not set', () => {
		setupUseSelectMock( {
			select: {
				getSettings: jest.fn( () => ( {} ) ),
			},
		} );

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.currentViewport ).toBe( 'Desktop' );
	} );

	it( 'calls updateBlockAttributes with correct metadata structure', () => {
		setupUseSelectMock();

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		result.current.updateVisibility( { mobile: false } );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith(
			[ 'block-1' ],
			{
				'block-1': {
					metadata: {
						blockVisibility: { mobile: false },
					},
				},
			},
			{ uniqueByBlock: true }
		);
	} );

	it( 'preserves existing metadata when updating visibility', () => {
		setupUseSelectMock( {
			select: {
				getBlocksByClientId: jest.fn( () => [
					{
						clientId: 'block-1',
						attributes: {
							metadata: {
								name: 'Custom Name',
								blockVisibility: undefined,
							},
						},
					},
				] ),
			},
		} );

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		result.current.updateVisibility( false );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith(
			[ 'block-1' ],
			{
				'block-1': {
					metadata: {
						name: 'Custom Name',
						blockVisibility: false,
					},
				},
			},
			{ uniqueByBlock: true }
		);
	} );

	it( 'toggleVisibility calculates new visibility and updates attributes', () => {
		setupUseSelectMock( {
			select: {
				getBlocksByClientId: jest.fn( () => [
					{
						clientId: 'block-1',
						attributes: {
							metadata: {
								blockVisibility: undefined,
							},
						},
					},
				] ),
				getSettings: jest.fn( () => ( {
					__experimentalDeviceType: 'Mobile',
				} ) ),
			},
		} );

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		result.current.toggleVisibility();

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith(
			[ 'block-1' ],
			{
				'block-1': {
					metadata: {
						blockVisibility: { mobile: false },
					},
				},
			},
			{ uniqueByBlock: true }
		);
	} );

	it( 'handles single clientId', () => {
		setupUseSelectMock();

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.blocks ).toHaveLength( 1 );
	} );

	it( 'handles array of clientIds', () => {
		setupUseSelectMock( {
			select: {
				getBlocksByClientId: jest.fn( () => [
					{
						clientId: 'block-1',
						attributes: { metadata: {} },
					},
					{
						clientId: 'block-2',
						attributes: { metadata: {} },
					},
				] ),
			},
		} );

		const { result } = renderHook( () =>
			useBlockVisibility( [ 'block-1', 'block-2' ] )
		);

		expect( result.current.blocks ).toHaveLength( 2 );
	} );

	it( 'returns visibilitySettings from first block', () => {
		const visibility = { mobile: false, tablet: true };
		setupUseSelectMock( {
			select: {
				getBlocksByClientId: jest.fn( () => [
					{
						clientId: 'block-1',
						attributes: {
							metadata: {
								blockVisibility: visibility,
							},
						},
					},
				] ),
			},
		} );

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.visibilitySettings ).toEqual( visibility );
	} );

	it( 'returns null for visibilitySettings when undefined', () => {
		setupUseSelectMock();

		const { result } = renderHook( () => useBlockVisibility( 'block-1' ) );

		expect( result.current.visibilitySettings ).toBeNull();
	} );
} );

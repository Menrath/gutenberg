/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import {
	isHiddenForViewport,
	hasAnyVisibilitySettings,
	getToggledVisibility,
} from './block-visibility-utils';

/**
 * Hook for managing block visibility state and actions.
 *
 * @param {string|string[]} clientIds Single client ID or array of client IDs.
 * @return {Object} Block visibility state and actions.
 */
export default function useBlockVisibility( clientIds ) {
	const clientIdsArray = useMemo(
		() => ( Array.isArray( clientIds ) ? clientIds : [ clientIds ] ),
		[ clientIds ]
	);

	const { blocks, canToggle, currentViewport } = useSelect(
		( select ) => {
			const { getBlockName, getBlocksByClientId, getSettings } =
				select( blockEditorStore );
			const _blocks = getBlocksByClientId( clientIdsArray );
			const settings = getSettings();
			const viewportType = settings.__experimentalDeviceType ?? 'Desktop';

			return {
				blocks: _blocks,
				canToggle: _blocks.every( ( { clientId } ) =>
					hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					)
				),
				currentViewport: viewportType,
			};
		},
		[ clientIdsArray ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const isHidden = blocks.some( ( block ) =>
		isHiddenForViewport(
			block.attributes?.metadata?.blockVisibility,
			currentViewport
		)
	);
	const isHiddenInAnyDevice = blocks.some( ( block ) =>
		hasAnyVisibilitySettings( block.attributes?.metadata?.blockVisibility )
	);

	/**
	 * Update visibility settings for the selected blocks.
	 *
	 * @param {boolean|Object} visibility New visibility settings.
	 */
	const updateVisibility = ( visibility ) => {
		const attributesByClientId = Object.fromEntries(
			blocks.map( ( { clientId, attributes } ) => [
				clientId,
				{
					metadata: {
						...attributes?.metadata,
						blockVisibility: visibility,
					},
				},
			] )
		);

		updateBlockAttributes( clientIdsArray, attributesByClientId, {
			uniqueByBlock: true,
		} );
	};

	/**
	 * Toggle visibility on the current viewport.
	 */
	const toggleVisibility = () => {
		const attributesByClientId = Object.fromEntries(
			blocks.map( ( { clientId, attributes } ) => {
				const currentVisibility = attributes?.metadata?.blockVisibility;
				const isCurrentlyHidden = isHiddenForViewport(
					currentVisibility,
					currentViewport
				);
				const visibility = getToggledVisibility(
					currentVisibility,
					currentViewport,
					isCurrentlyHidden
				);

				return [
					clientId,
					{
						metadata: {
							...attributes?.metadata,
							blockVisibility: visibility,
						},
					},
				];
			} )
		);

		updateBlockAttributes( clientIdsArray, attributesByClientId, {
			uniqueByBlock: true,
		} );
	};

	return {
		blocks,
		canToggle,
		isHidden,
		isHiddenInAnyDevice,
		visibilitySettings:
			blocks[ 0 ]?.attributes?.metadata?.blockVisibility ?? null,
		currentViewport,
		updateVisibility,
		toggleVisibility,
	};
}

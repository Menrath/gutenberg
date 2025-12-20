/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import path from 'path';
import { findRootSync, DEFAULT_TOOLS } from '@manypkg/find-root';

/**
 * Shared cache for package.json files to avoid redundant reads.
 * Cache is keyed by the full package name from package.json's name field.
 */
const packageJsonCache = new Map();
const packagePathCache = new Map();

/**
 * Lazily initialized map of workspace packages.
 * Maps package name to its directory path.
 *
 * @type {Map<string, string>|null}
 */
let workspacePackages = null;

/**
 * Get the workspace packages map, initializing it if necessary.
 *
 * @return {Map<string, string>} Map of package name to directory path.
 */
function getWorkspacePackagesMap() {
	if ( workspacePackages === null ) {
		workspacePackages = new Map();
		const { tool: toolType, rootDir } = findRootSync( process.cwd() );
		const tool = DEFAULT_TOOLS.find( ( t ) => t.type === toolType );

		if ( ! tool ) {
			throw new Error( `Could not find ${ toolType } tool` );
		}

		const { packages } = tool.getPackagesSync( rootDir );

		for ( const pkg of packages ) {
			// Only add packages that have a name field
			if ( pkg.packageJson.name ) {
				workspacePackages.set( pkg.packageJson.name, pkg.dir );
			}
		}
	}
	return workspacePackages;
}

/**
 * @typedef  {Object} PackageJson
 *
 * @property {string}                 name                    Package name.
 * @property {string}                 version                 Package version.
 * @property {string}                 [description]           Package description.
 * @property {string}                 [author]                Package author.
 * @property {string}                 [license]               Package license.
 * @property {string}                 [main]                  Main entry point.
 * @property {string}                 [module]                ES module entry point.
 * @property {string}                 [react-native]          React Native entry point.
 * @property {Record<string, string>} [dependencies]          Runtime dependencies.
 * @property {Record<string, string>} [devDependencies]       Development dependencies.
 * @property {Record<string, string>} [peerDependencies]      Peer dependencies.
 * @property {string[]}               [wpScript]              WordPress script handles for dependency extraction.
 * @property {Record<string, string>} [wpScriptModuleExports] WordPress script module exports.
 * @property {Object}                 [sideEffects]           Side effects configuration for tree shaking.
 * @property {string}                 [publishConfig]         NPM publish configuration.
 * @property {Record<string, string>} [scripts]               NPM scripts.
 * @property {string[]}               [files]                 Files to include in package.
 * @property {string}                 [repository]            Repository URL.
 * @property {string[]}               [keywords]              Package keywords.
 */

// Create a new type that extends PackageJson with an optional "route" property
/**
 * @typedef {PackageJson & { route: { path: string; page?: string } }} RoutePackageJson
 */

/**
 * Get package.json info for a package.
 * First checks workspace packages, then falls back to reading from the package directory.
 *
 * @param {string} fullPackageName The full package name (e.g., '@wordpress/blocks').
 * @return {PackageJson|null} Package.json object or null if not found.
 */
export function getPackageInfo( fullPackageName ) {
	if ( packageJsonCache.has( fullPackageName ) ) {
		return packageJsonCache.get( fullPackageName );
	}

	const workspaceMap = getWorkspacePackagesMap();
	const packageDir = workspaceMap.get( fullPackageName );

	if ( ! packageDir ) {
		return null;
	}

	const packageJsonPath = path.join( packageDir, 'package.json' );
	const result = getPackageInfoFromFile( packageJsonPath );
	packageJsonCache.set( fullPackageName, result );

	return result;
}

/**
 * Get package.json info from an explicit file path.
 * Reads the package.json file and caches it by its name field.
 *
 * @param {string} packageJsonPath Absolute path to package.json file.
 * @return {PackageJson|null} Package.json object or null if not found.
 */
export function getPackageInfoFromFile( packageJsonPath ) {
	if ( packagePathCache.has( packageJsonPath ) ) {
		return packagePathCache.get( packageJsonPath );
	}
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	packagePathCache.set( packageJsonPath, packageJson );
	return packageJson;
}

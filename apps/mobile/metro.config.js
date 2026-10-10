// Metro for the pnpm workspace. expo/metro-config already detects the monorepo; the lines below only make the
// workspace setup explicit (and keep it working if detection changes): watch the repo root so edits in
// packages/core and packages/data-lux reload, and resolve from the app's and the root node_modules.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...new Set([...(config.watchFolders ?? []), workspaceRoot])];
config.resolver.nodeModulesPaths = [
  ...new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ]),
];
// @wtl/data-lux exposes its JSON through package "exports" ("@wtl/data-lux/grid.json").
config.resolver.unstable_enablePackageExports = true;

module.exports = config;

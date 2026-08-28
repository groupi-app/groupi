const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: preserve Expo's defaults while also watching shared workspace code.
config.watchFolders = [...new Set([...config.watchFolders, monorepoRoot])];

// Monorepo: resolve node_modules from both package and root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Expo loads .env values into the Metro process before bundling. Keep the
// source files themselves out of Metro/Uniwind's transform graph so ignored
// preview credentials cannot be parsed or bundled as JavaScript modules.
const envFileBlockList = /[\\/]packages[\\/]mobile[\\/]\.env(?:\..*)?$/;
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = existingBlockList
  ? Array.isArray(existingBlockList)
    ? [...existingBlockList, envFileBlockList]
    : [existingBlockList, envFileBlockList]
  : envFileBlockList;

// Workspace packages have their own Convex development dependency for
// isolated tests. Resolve every Convex import from the mobile package so its
// hooks and provider share one React context, while leaving normal transitive
// dependency resolution intact for Expo and other packages.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'convex' || moduleName.startsWith('convex/')) {
    return context.resolveRequest(
      {
        ...context,
        originModulePath: path.resolve(projectRoot, 'package.json'),
      },
      moduleName,
      platform
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './src/uniwind-types.d.ts',
});

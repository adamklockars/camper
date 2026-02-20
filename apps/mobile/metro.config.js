const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo (workspace packages)
config.watchFolders = [monorepoRoot];

// Resolve modules from the monorepo root node_modules first, then the project
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Ensure the project root is set so Metro can resolve workspace packages
config.resolver.disableHierarchicalLookup = false;

module.exports = config;

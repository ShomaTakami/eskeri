const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// @react-navigation/* の package.json "exports" と内部の相対 import の競合を回避
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

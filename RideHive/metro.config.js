const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch and bundle shared modules from the parent directory
config.watchFolders = [
  path.resolve(__dirname, '../shared')
];

// Resolve modules from the project root and parent directory
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../node_modules')
];

// Configure platform-specific file extensions
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Custom resolver to handle react-native-maps
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    // Return a mock module for web
    return {
      filePath: path.resolve(__dirname, 'web-mocks/react-native-maps.js'),
      type: 'sourceFile',
    };
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
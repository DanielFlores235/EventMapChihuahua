const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Si estamos compilando para WEB, redirigimos el paquete nativo al adaptador web
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return context.resolveRequest(context, '@teovilla/react-native-web-maps', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

const appJson = require('./app.json');

/** @type {import('@expo/config').ExpoConfig} */
module.exports = () => {
  const previewShortTimer =
    process.env.EAS_BUILD_PROFILE === 'preview' ||
    process.env.EXPO_PUBLIC_PREVIEW_SHORT_TIMER === 'true';

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      previewShortTimer,
    },
  };
};

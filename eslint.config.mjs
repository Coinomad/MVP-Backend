const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = {
  overrides: [
    {
      files: ["**/*.js"],
      languageOptions: {
        sourceType: "commonjs",
      },
      globals: globals.browser,
      ...pluginJs.configs.recommended,
    },
  ],
};

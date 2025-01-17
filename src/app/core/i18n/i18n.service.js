// main object content for i18n
const plugins18nConfig = {};

function init(config) {
  config.appLanguages.forEach(lng =>{
    plugins18nConfig[lng] = {
      plugins: {}
    }
  });
  i18next
  .use(i18nextXHRBackend)
  .init({
      lng: config.lng,
      ns: 'app',
      fallbackLng: 'en',
      resources: config.resources
  });
  return new Promise((resolve, reject) => {
    jqueryI18next.init(i18next, $, {
      tName: 't', // --> appends $.t = i18next.t
      i18nName: 'i18n', // --> appends $.i18n = i18next
      handleName: 'localize', // --> appends $(selector).localize(opts);
      selectorAttr: 'data-i18n', // selector for translating elements
      targetAttr: 'data-i18n-target', // element attribute to grab target element to translate (if diffrent then itself)
      optionsAttr: 'data-i18n-options', // element attribute that contains options, will load/set if useOptionsAttr = true
      useOptionsAttr: false, // see optionsAttr
      parseDefaultValueFromContent: true // parses default values from content ele.val or ele.text
    });
    addI18n(plugins18nConfig);
    resolve();
  })

}
const getAppLanguage = function() {
  const ApplicationService = require('core/applicationservice');
  const config = ApplicationService.getConfig();
  return config.user.i18n || "en";
};


// function to translate
const t = function(text) {
  return i18next.t(text);
};

// function to translate plugins
const tPlugin = function(text) {
  return i18next.t(`plugins.${text}`);
};

const tPrefix = function(filter) {
  return function(text) {
    return i18next.t(`${filter}.${text}`);
  }
};

const addI18nPlugin = function({name, config}) {
  for (const language in config) {
    const pluginLng = plugins18nConfig[language];
    if (pluginLng) pluginLng.plugins[name] = config[language];
  }
  addI18n(plugins18nConfig);
};

const addI18n = function(i18nObject) {
  for (const lng in i18nObject) {
    const lngObj = i18nObject[lng];
    for (const key in lngObj)  {
      i18next.addResource(lng, 'translation', key, lngObj[key])
    }
  }
};

const changeLanguage = function(lng){
  i18next.changeLanguage(lng);
};

module.exports = {
  init,
  t,
  tPlugin,
  tPrefix,
  addI18n,
  addI18nPlugin,
  changeLanguage,
  getAppLanguage
};

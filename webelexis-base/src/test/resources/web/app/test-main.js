var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

var pathToModule = function (path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function (file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base/',
    paths: {
        "bootstrap": "dist/web/lib/bootstrap.min",
        "jquery": "dist/web/lib/jquery.min",
        "jquery-ui": "dist/web/lib/jquery-ui",
        "knockout": "dist/web/lib/knockout",
        "sockjs": "dist/web/lib/sockjs.min",
        "text": "dist/web/lib/text",
        "vertxbus": "dist/web/lib/vertxbus",
        "domReady": "dist/web/lib/domReady",
        "knockout-jqueryui": "dist/web/lib/knockout-jqueryui",
        "domReady": "dist/web/lib/domReady",
        "chai": "node_modules/chai/lib/chai",
        "app": "dist/web/app",
        "components": "dist/web/components",
        "html": "dist/web/html"
    },
    shim: {
        "bootstrap": {
            deps: ["jquery"]
        },
        "knockout": {
            deps: ["jquery"]
        },
    },

    // dynamically load all test files
    deps: allTestFiles,

    callback: window.__karma__.start
});
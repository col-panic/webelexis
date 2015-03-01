var require={
    baseUrl: "web",
    paths: {
        "bootstrap":    "bower_components/bootstrap/dist/js/bootstrap.min.js",
        "jquery":       "bower_components/jquery/dist/jquery.js",
        "knockout":     "bower_components/knockoutjs/dist/knockout.js",
        "sockjs":       "bower_components/sockjs-client/dist/sockjs.js"
    },
    shim:{
        "bootstrap":    { deps: ["jquery"]}
    }
};

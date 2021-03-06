(function () {
    function run () {
       
        // (reads from quizServer.cfg and mypwd.txt)
        var config = require('./lib/config').config;

        var optsModule = require('./lib/opts.js');
        var optsClass = new optsModule.optsClass(config);
        var opts = optsClass.getOpts();
        if (!opts) {
            return;
        } else if (opts.save_parameters) {
            console.log("Save parameters!");
        }

        // (creates subdirs and sqlite3 database if necessary,
        // migrates to sqlite3 db from old CSV files, and removes
        // CSV and their subdirs after validation)
        var initModule = require('./lib/init.js');
        var initClass = new initModule.initClass(opts);
        var init = initClass.getInit();

        var sysModule = require('./lib/sys.js');
        var sysClass = new sysModule.sysClass(opts);
        var sys = sysClass.getSys();

        var pagesModule = require(process.cwd() + '/style/' + sys.output_style + '.js');
        var pagesClass = new pagesModule.pagesClass(sys);
        var sys = pagesClass.getPages();

        var cogsModule = require('./lib/cogs.js');
        var cogsClass = new cogsModule.cogsClass(sys);
        var cogs = cogsClass.getCogs();

        var apiModule = require('./lib/api.js');
        var apiClass = new apiModule.apiClass(sys,cogs);
        var api = apiClass.getApi();

        var serverModule = require('./lib/server.js');
        var serverClass = new serverModule.serverClass(sys,api);
        serverClass.runServer();
    };
    function runDemoServer () {
        var server = require('newswriter-demo')
	server.run();
    };
    exports.runDemoServer = runDemoServer;
    exports.run = run;
})();


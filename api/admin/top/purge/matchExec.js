(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.sys.apiError;
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(this.page)
    }
    exports.cogClass = cogClass;
})();

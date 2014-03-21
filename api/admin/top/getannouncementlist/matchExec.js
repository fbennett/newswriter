(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;

        var sql = 'SELECT eventID,strftime("%Y-%m-%d",(pageDate/1000),"unixepoch") || " | " || title AS title '
            + 'FROM events '
            + 'JOIN titles USING(titleID) '
            + 'WHERE presenterID IS NULL AND status > -1 '
            + 'ORDER BY pageDate DESC';

        sys.db.all(sql,function(err,rows){
            if (err||!rows) {return oops(response,err,'getannouncementlist(1)')};
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows))
        });
    }
    exports.cogClass = cogClass;
})();

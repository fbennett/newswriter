(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.utils.apiError;
        var sys = this.sys;
        var documentID = params.documentid;

        var sql = 'SELECT documentID,title '
            + 'FROM documents '
            + 'JOIN titles USING(titleID) '
            + 'WHERE documentID=?';

        sys.db.get(sql,[documentID],function(err,row){
            if (err||!row||!row.documentID) {return oops(response,err,'event/getonedocument(1)')};
            row.url = 'http://' + sys.proxy_hostname + sys.gslfrontpage_path + 'attachments/' + documentID;
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(row));
        });
    }
    exports.cogClass = cogClass;
})();

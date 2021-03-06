(function () {
    var cogClass = function () {};
    cogClass.prototype.exec = function (params, request, response) {
        var oops = this.sys.apiError;
        var sys = this.sys;
        var data = params.data;
        var userKey = params.userkey;
        var userID = sys.admin[userKey].id;

        var date = new Date();
        var touchDate = sys.getUnixEpoch(date.getTime());

        beginTransaction();

        function beginTransaction() {
            var sql = 'BEGIN TRANSACTION;';
            sys.db.run(sql,function(err){
                if (err) {return oops(response,err,'saveevent(0)')};
                checkTitle();
            });
        };

        // Check title
        function checkTitle () {
            var sql = 'SELECT titleID FROM titles WHERE title=?;';
            sys.db.get(sql,[data.title],function(err,row){
                if (err) {return oops(response,err,'saveevent(1)')};
                if (row && row.titleID) {
                    data.title = row.titleID;
                    checkDescription();
                } else {
                    addTitle();
                }
            });
        };
        function addTitle () {
            var sql = 'INSERT INTO titles VALUES (NULL,?);';
            sys.db.run(sql,[data.title],function(err){
                if (err) {return oops(response,err,'saveevent(2)')};
                data.title = this.lastID;
                checkDescription();
            });
        };

        // Check description
        function checkDescription () {
            var sql = 'SELECT descriptionID FROM descriptions WHERE description=?;';
            sys.db.get(sql,[data.description],function(err,row){
                if (err) {return oops(response,err,'saveevent(3)')};
                if (row && row.descriptionID) {
                    data.description = row.descriptionID;
                    if (data.note) {
                        checkNote();
                    } else {
                        checkEvent();
                    }
                } else {
                    addDescription();
                }
            });
        };
        function addDescription () {
            var sql = 'INSERT INTO descriptions VALUES (NULL,?);';
            sys.db.run(sql,[data.description],function(err){
                if (err) {return oops(response,err,'saveevent(4)')};
                data.description = this.lastID;
                if (data.note) {
                    checkNote();
                } else {
                    checkEvent();
                }
            });
        };
        
        // Check note
        function checkNote () {
            var sql = 'SELECT noteID FROM notes WHERE note=?;';
            sys.db.get(sql,[data.note],function(err,row){
                if (err) {return oops(response,err,'saveevent(5)')};
                if (row && row.noteID) {
                    data.note = row.noteID;
                    checkEvent();
                } else {
                    addNote();
                }
            });
        };
        function addNote () {
            var sql = 'INSERT INTO notes VALUES (NULL,?);';
            sys.db.run(sql,[data.note],function(err){
                if (err) {return oops(response,err,'saveevent(6)')};
                data.note = this.lastID;
                checkEvent();
            });
        };

        // Add or update event
        function checkEvent () {
            if (data.eventID) {
                var sql = 'SELECT published,status FROM events WHERE eventID=?;';
                sys.db.get(sql,[data.eventID],function(err,row){
                    if (err||!row) {return oops(response,err,'saveevent(7)')};
                    data.published = row.published;
                    data.status = row.status;
                    updateEvent();
                });
            } else {
                addEvent();
            }
        };
        function updateEvent () {
            // XXX Plus convenorID, presenterID, pageDate
            var presenterID = data.presenterID;
            if (!data.presenterID) {
                presenterID = null;
            }
            var noteID = data.note;
            if (!noteID) {
                noteID = null;
            }
            var sql = 'UPDATE events SET adminID=?, titleID=?, descriptionID=?, noteID=?, convenorID=?, presenterID=?, pageDate=? WHERE eventID=?;';
            sys.db.run(sql,[userID,data.title,data.description,data.note,data.convenorID,presenterID,data.pageDate,data.eventID],function(err){
                if (err) {return oops(response,err,'saveevent(8)')};
                clearSessions();
            });
        };
        function addEvent () {
            var presenterID = data.presenterID;
            if (!data.presenterID) {
                presenterID = null;
            }
            var noteID = data.note;
            if (!noteID) {
                noteID = null;
            }

            var sql = 'INSERT INTO events VALUES (NULL,?,?,?,?,?,?,?,0,0,?)';
            sys.db.run(sql,[userID,data.convenorID,data.title,data.description,data.pageDate,presenterID,noteID,touchDate],function(err){
                if (err) {return oops(response,err,'saveevent(9) ('+data.title+") ("+data.description+") ("+noteID+") ("+presenterID+") ("+data.convenorID+")")};
                data.eventID = this.lastID;
                data.published = false;
                data.status = 0;
                clearSessions();
            });
        };
        
        // Clear sessions
        function clearSessions () {
            var sql = 'DELETE FROM sessions WHERE eventID=?;';
            sys.db.run(sql,[data.eventID],function(err){
                if (err) {return oops(response,err,'saveevent(10)')};
                var limit = 0;
                if (data.sessions) {
                    limit = data.sessions.length;
                }
                checkSessionTitles(0,limit);
            });
        };
        // Add sessions
        function checkSessionTitles (pos,limit) {
            if (pos === limit) {
                addSessionTitles(0,limit);
                return;
            }
            var title = data.sessions[pos].title;
            var sql = 'SELECT titleID FROM titles WHERE title=?;';
            sys.db.get(sql,[title],function(err,row){
                if (err) {return oops(response,err,'saveevent(11)')};
                if (row && row.titleID) {
                    data.sessions[pos].title = row.titleID;
                }
                checkSessionTitles(pos+1,limit);
            });
        };
        function addSessionTitles (pos,limit) {
            if (pos === limit) {
                checkPlaces(0,limit);
                return;
            }
            if ("number" !== typeof data.sessions[pos].title) {
                var title = data.sessions[pos].title;
                var sql = 'INSERT INTO titles VALUES (NULL,?);';
                sys.db.run(sql,[title],function(err){
                    if (err) {return oops(response,err,'saveevent(12)')};
                    data.sessions[pos].title = this.lastID;
                    addSessionTitles(pos+1,limit);
                });
            } else {
                addSessionTitles(pos+1,limit);
            }
        };
        function checkPlaces (pos,limit) {
            if (pos === limit) {
                addPlaces(0,limit);
                return;
            }
            var place = data.sessions[pos].place;
            var sql = 'SELECT placeID FROM places WHERE place=?;';
            sys.db.get(sql,[place],function(err,row){
                if (err) {return oops(response,err,'saveevent(13)')};
                if (row && row.placeID) {
                    data.sessions[pos].place = row.placeID;
                    // XXX Nudge touchDate
                    var sql = 'UPDATE places SET touchDate=? WHERE placeID=?;';
                    sys.db.run(sql,[touchDate,row.placeID],function(err){
                        if (err) {return oops(response,err,'saveevent(13)')};
                        checkPlaces(pos+1,limit);
                    });
                } else {
                    checkPlaces(pos+1,limit);
                }
            });
        };
        function addPlaces (pos,limit) {
            if (pos === limit) {
                addSessions(0,limit);
                return;
            }
            if ("number" !== typeof data.sessions[pos].place) {
                var place = data.sessions[pos].place;
                var sql = 'INSERT INTO places VALUES (NULL,?,?);';
                sys.db.run(sql,[place,touchDate],function(err){
                    if (err) {return oops(response,err,'saveevent(14)')};
                    data.sessions[pos].place = this.lastID;
                    addPlaces(pos+1,limit);
                });
            } else {
                addPlaces(pos+1,limit);
            }
        };
 
        function addSessions (pos,limit) {
            if (pos === limit) {
                clearAttachments();
                return;
            };
            var session = data.sessions[pos];
            var sql = 'INSERT INTO sessions VALUES (NULL,?,?,?,?,?);';
            sys.db.run(sql,[data.eventID,session.title,session.place,session.startDateTime,session.endDateTime],function(err){
                //console.log("HAVE: eventID="+data.eventID+", titleID="+data.title+", placeID="+session.place);
                if (err) {return oops(response,err,'saveevent(15)')};
                addSessions(pos+1,limit);
            });
        };
        
        // Clear attachments
        function clearAttachments () {
            var sql = 'DELETE FROM attachments WHERE eventID=?;';
            sys.db.run(sql,[data.eventID],function(err){
                if (err) {return oops(response,err,'saveevent(16)')};
                var limit = 0;
                if (data.attachments) {
                    limit = data.attachments.length;
                }
                touchDocuments(0,limit);
            });
        };
        // Touch documents
        function touchDocuments (pos,limit) {
            if (pos === limit) {
                addAttachments(0,limit);
                return;
            }
            var documentID = data.attachments[pos];
            var sql = 'UPDATE documents SET touchDate=? WHERE documentID=?;';
            sys.db.run(sql,[touchDate,documentID],function(err){
                if (err) {return oops(response,err,'saveevent(17)')};
                touchDocuments(pos+1,limit);
            });
        };
        // Add attachments
        function addAttachments (pos,limit) {
            if (pos === limit) {
                finishTransaction();
                return;
            }
            var documentID = data.attachments[pos];
            var sql = 'INSERT INTO attachments VALUES (NULL,?,?);';
            sys.db.run(sql,[data.eventID,documentID],function(err){
                if (err) {return oops(response,err,'saveevent(18)')};
                addAttachments(pos+1,limit);
            });
        };

        // Finish transaction
        function finishTransaction () {
            sql = 'END TRANSACTION;';
            sys.db.run(sql,function(err){
                if (err) {return oops(response,err,'saveevent(19)')};
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({eventID:data.eventID,published:data.published,status:data.status}));
            });
        };
    }
    exports.cogClass = cogClass;
})();

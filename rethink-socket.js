'use strict';
/* rethink-sockets
    listens to all rethinkDb tables and stars a changefeed for each one
*/
var r = require('rethinkdb'),
    _ = require('lodash'),
    socket,
    io;

function connect(config, callback) {
    //socket = config.socket;
    r.connect({
        host: config.host || 'localhost',
        port: config.port || 28015
    }, function(err, connection) {
        if (err) {
            console.warn(err);
            return callback(err);
        }

        connection._id = Math.floor(Math.random() * 10001);
        callback(err, connection);
    });
}

function tables(cb) {
    connect({}, function(err, conn) {
        if (err) {
            return cb(err);
        }
        return r.db('mine').tableList().run(conn, cb);
    });
}

function init(config, cb) {
    console.log('initializing all socket listener');
        // get all tables then setup the base sockets for each...
        // for now just print them out
    socket = config.socket;
    io = config.io;
    // console.log(socket);
    var tableList = [];
    socket.on('tables:connect', function(data, cb) {
        tables(function(err, tables) {
            console.log('Found these tables:', tables);
            // does the client need to know we connected?
            tables.each(function(err, table) {
                tableList.push(table);
                initTableSockets(socket, table, function() {
                    io.sockets.emit('tables:connected', {
                        table: table
                    });
                });
            }, function() {
                return cb(tableList);
            });
        });
    });
    //return cb();
}

function initTableSockets(socket, table, cb) {
    console.log('initializing sockets for', table);

    connect({}, function(err, conn) {
        console.log("connected, go do socket setup");

        socket.on(table + ':findById', function(id, msg) {
            r.db('mine').table(table)
                .get(id)
                .run(conn, function(err, data){
                    socket.emit(table + ':foundById', data);
                });
        });

        socket.on(table + ':add', function(record, cb) {
            console.log("Add a new record", record, cb);
            record = _.pick(record, 'name', 'question');
            record.createdAt = new Date();

            r.db('mine').table(table)
                .insert(record)
                .run(conn, function(err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        record.id = result.generated_keys[0];
                        cb(null, record);
                    }
                });

        });

        socket.on(table + ':update', function(record, cb) {
            record = _.pick(record, 'id', 'name', 'question');
            r.db('mine').table(table)
                .get(record.id)
                .update(record)
                .run(conn, cb);
        });

        socket.on(table + ':delete', function(id, cb) {
            r.db('mine').table(table)
                .get(id)
                .delete()
                .run(conn, cb);

        });

        console.log(table + ':changes:start');
        socket.on(table + ':changes:start', function(data) {
            var limit = data.limit || 100,
                filter = data.filter || {};
            console.log("LIMIT:", limit);
            r.db('mine').table(table)
                .orderBy({
                    index: r.desc('id')
                })
                .filter(filter)
                .limit(limit)
                .changes()
                .run(conn, handleChange);

            function handleChange(err, cursor) {
                console.log("handle changes for", table);
                if (err) {
                    console.log(err);
                } else {
                    if (cursor) {
                        cursor.each(function(err, record) {
                            if (err) {
                                console.log(err);
                            } else {
                                socket.emit(table + ':changes', record);
                            }
                        });
                    }
                }

                socket.on(table + ':changes:stop', stopCursor);
                socket.on('disconnect', stopCursor);

                function stopCursor() {
                    if (cursor) {
                        cursor.close();
                    }
                    socket.removeListener(table + ':changes:stop', stopCursor);
                    socket.removeListener('disconnect', stopCursor);
                }

            }
            console.log("finished em all")
        });
        return cb();
    });
} // end initTableSockets

module.exports = {
    connect: connect,
    init: init,
    tables: tables,
    socket: socket
};

var r = require("rethinkdb"),
    dbConfig = { host: 'localhost', port: 28015 };

module.exports = {
    getStuff: getStuff,
    connect: connect,
    config: dbConfig,
    tables: tables,
    houses: houses,
    houseFeed: houseFeed
};

function getStuff(cb){
    connect(function(err, conn) {
        if(err){
            console.log(err);
            return err;
        }
        console.log("CONNECTED");
        r.db("mine").table("house").count().run(conn, function(err, res){
            if(err){
                console.warn(err);
                return cb(err);
            }
            console.log("COUNT", res);
            r.db("mine").table("house").run(conn, function(err, houses){
                houses.each(function(err, thing){
                    console.log(err, thing);
                }, function(){
                    console.log("post houses")
                    return cb();
                })
            });
        })

    });
}

function example(){
    r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
      if(err) throw err;
      r.db('test').tableCreate('tv_shows').run(conn, function(err, res) {
        if(err) throw err;
        console.log(res);
        r.table('tv_shows').insert({ name: 'Star Trek TNG' }).run(conn, function(err, res)
        {
          if(err) throw err;
          console.log(res);
        });
      });
    });

}

function connect(callback) {
  r.connect({host: dbConfig.host, port: dbConfig.port }, function(err, connection) {
    if(err){
        console.warn(err);
        return callback(err);
    }

    connection['_id'] = Math.floor(Math.random()*10001);
    callback(err, connection);
  });
}

// returns a cursor
function houses(cb){
    connect(function(err, conn) {
        if (err) cb(err);
        return r.db("mine").table("house").run(conn, cb);
    });
}

// returns a cursor and keeps the socket connection open
function houseFeed(cb){
    connect(function(err, conn) {
        if (err) cb(err);
        return r.db("mine").table("house").orderBy({index: "name"}).limit(5).changes().run(conn, cb);
    });
}

function tables(cb) {
    connect(function(err, conn) {
        if (err) cb(err);
        return r.db("mine").tableList().run(conn, cb);
    });
}
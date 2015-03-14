/*************************************
//
// rethinkcollege app
//
**************************************/

// express magic
var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var device  = require('express-device');
var r = require("rethinkdb");
var db = require("./db");
var rsock = require("./rethink-socket");

var runningPortNumber = process.env.PORT;


app.configure(function(){
    // I need to access everything in '/public' directly
    app.use(express.static(__dirname + '/public'));

    //set the view engine
    app.set('view engine', 'ejs');
    app.set('views', __dirname +'/views');

    app.use(device.capture());
});


// logs every request
app.use(function(req, res, next){
    // output every request in the array
    console.log({method:req.method, url: req.url, device: req.device});

    // goes onto the next function in line
    next();
});

app.get("/", function(req, res){
    console.log("doing something?")
    //db.getStuff(function(){
    res.render('index', {});
    //});
});



io.sockets.on('connection', function (socket) {

    io.sockets.emit('blast', {msg:"<span style=\"color:red !important\">someone connected</span>"});

    socket.on("tables", function(data, cb){
        console.log(data, cb);
        db.houseFeed(function(err, tables){
            console.log("tables?", tables);
            tables.each(function(err, table){
                console.log(table)
                io.sockets.emit("tables", {msg:table})
            }, function(){
                return cb();
            })

            //return cb();
        })
        //cb();
    });

    socket.on('blast', function(data, fn){
        console.log(data);
        io.sockets.emit('blast', {msg:data.msg});

        fn();//call the client back to clear out the field
    });

});


server.listen(runningPortNumber);


'use strict';
/*************************************
//
// rethinkcollege app
//
**************************************/
// connect to our socket server
//var socket = io.connect('http://127.0.0.1:1337/');

var app = app || {};

// shortcut for document.ready
// $(function(){
// 	//setup some common vars
// 	var $blastField = $('#blast'),
// 		$allPostsTextArea = $('#allPosts'),
// 		$clearAllPosts = $('#clearAllPosts'),
// 		$sendBlastButton = $('#send');


// 	//SOCKET STUFF
// 	socket.on("blast", function(data){
// 		var copy = $allPostsTextArea.html();
// 		$allPostsTextArea.html('<p>' + copy + data.msg + "</p>");
// 		$allPostsTextArea.scrollTop($allPostsTextArea[0].scrollHeight - $allPostsTextArea.height());
// 		//.css('scrollTop', $allPostsTextArea.css('scrollHeight'));

// 	});

// 	// first just initialize the table
// 	socket.emit("tables:connect", {}, function(data){
// 		console.log("finished emitting tables", data);
// 	});

// 	// listen for table changes
// 	socket.on("tables:connected", function(data){
// 		console.log(data);

// 		socket.on(data.table + ":foundById", function(data){
// 			console.log("FOUND:", data);
// 		});

// 		socket.on(data.table + ":changes", function(data){
// 			console.log("CHANGES:", data);
// 		});

// 		socket.emit(data.table + ":changes:start", {});
// 	});


// 	$clearAllPosts.click(function(e){
// 		$allPostsTextArea.text('');
// 	});

// 	$sendBlastButton.click(function(e){

// 		var blast = $blastField.val();
// 		if(blast.length){
// 			socket.emit("blast", {msg:blast},
// 				function(data){
// 					$blastField.val('');
// 				});
// 		}


// 	});

// 	$blastField.keydown(function (e){
// 	    if(e.keyCode == 13){
// 	        $sendBlastButton.trigger('click');//lazy, but works
// 	    }
// 	})

// });

// Example usage in angularjs
var app = angular.module('app', ['btford.socket-io', 'bindtable']);

app.factory('mySocket', function(socketFactory) {
    return socketFactory();
});

app.factory('bindTable', function(bindTableFactory, mySocket) {
    return bindTableFactory({
        socket: mySocket
    });
});

app
    .controller('TableCtrl', tableCtrl);

function tableCtrl($scope, bindTable, mySocket) {
    var sock = mySocket;

    $scope.connectedTable = false;
    $scope.tables = [];
    $scope.updating = false;
    $scope.updateEl = "";
    $scope.new = '{ "name": "newName" }';
    // tell node to start listening
    sock.emit("tables:connect", {}, function(data) {

        // we will need to connect to the 1 table?
        //var table = bindTable(data[0]);
        $scope.tables = data;

        // calling bind(filter, limit, offset) creates a rows
        // property that is synchronized with changes on the server side
        // table.bind(null, 100);
        // $scope.data = table.rows;
        // $scope.delete = table.delete;

        // $scope.$on('$destroy', function(){
        // 	table.unBind();
        // });
    });

    $scope.send = function(tableName) {
        //sock.emit("tables:connect", {});
        // check if its in 'tables' returned
        var table = bindTable(tableName);
        table.bind(null, 100);
        $scope.connectedTable = table;
        $scope.data = table.rows;
        $scope.delete = table.delete;

        $scope.$on('$destroy', function() {
            table.unBind();
        });
    };

    $scope.addNew = function() {
        console.log("ADD NEW", $scope.new);
        $scope.connectedTable.add(JSON.parse($scope.new));
    };

    $scope.update = function() {
        console.log("Update", $scope.updateEl);
        $scope.connectedTable.update(JSON.parse($scope.updateEl));
        $scope.updateEl = "";
        $scope.updating = false;
    };

    $scope.remove = function(element) {
        console.log("REMOVE", element);
        //$scope.data.splice( $scope.data.indexOf(element), 1 );
        $scope.connectedTable.delete(element);
    };

    $scope.updateForm = function(element) {
        $scope.updating = true;
        $scope.updateEl = JSON.stringify(element);
    };
}
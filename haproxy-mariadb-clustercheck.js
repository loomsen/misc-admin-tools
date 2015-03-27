var mysql = require('mysql');
var http  = require('http');
var url   = require('url');
var systemd = require('systemd');

http.createServer(function(req, res) {

  function sendErr(code, reason) {
    res.writeHead(code, {
      'reason ': reason,
      'Content-Type': 'text/plain',
      'Connection': 'close'
    });
    res.end();
  }
  function sendOk() {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Connection': 'close' 
    });
    res.end();
  }

  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root'
  });

  connection.connect(function(err) {
    if (err) sendErr(503, 'mysql connection failed');
  });
  

/* Read Only? */
  var query_readonly = 'select variable_value as readonly from information_schema.global_variables where variable_name = "read_only";'
  connection.query(query_readonly, function(err, rows, results) {
    if (err) { sendErr(503, 'query failed'); return; }
    
    if (rows[0].readonly == 'ON') { 
      sendErr(503, 'server is read_only'); 
      return; 
    } 
  });
  
  var query_state = 'select variable_value as state from information_schema.global_status where variable_name = "wsrep_local_state"'
  connection.query(query_state, function(err, rows, results) {
    if (err) { sendErr(503, 'query failed'); return; }
    var state = new Array();
    state[1] = 'Joining';
    state[2] = 'Donor/Desynced';
    state[3] = 'Joined';
    state[4] = 'Synced';

    if (rows[0].state != '4') { 
      sendErr(503, state[rows[0].state]);
      return; 
    } else { 
      sendOk(); 
    }
  });
   
  connection.end();


}).listen('systemd');

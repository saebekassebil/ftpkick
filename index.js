var FTPClient = require('ftp')
  , Promise = require('promise')
  , Connection = require('./connection');

exports.connect = function connect(args) {
  var promise = Promise(function(resolve, reject) {
    var client = new FTPClient()

    client.on('ready', function() {
      resolve(new Connection(client));
    });

    client.on('error', function(e) {
      console.error(e);
    });

    client.connect(args);
  });

  return promise;
}

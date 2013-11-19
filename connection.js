var fs = require('fs')
  , path = require('path')
  , Promise = require('promise');

function recursiveRemove(client, dest) {
  var promise = Promise(function(resolve, reject) {
    client.list(dest, function(err, list) {
      if (err)
        return reject(err);

      function serialRemove(list, cb) {
        if (!list.length) return cb();

        var file = list.pop();
        if (file.type === 'd') {
          // Directory
          recursiveRemove(client, path.join(dest, file.name)).then(function() {
            serialRemove(list, cb);
          });
        } else if (file.type === '-') {
          // File
          client.delete(path.join(dest, file.name), function() {
            serialRemove(list, cb);
          });
        } else
          reject(new Error('Couldn\'t handle file type ' + file.type));
      }

      serialRemove(list, function() {
        client.rmdir(dest, function(err) {
          if (err)
            reject(err);
          else
            resolve()
        });
      });
    });
  });

  return promise;
}

function recursivePut(client, source, dest) {
  var promise = Promise(function(resolve, reject) {
    fs.stat(source, function(err, stat) {
      if (err)
        return reject(err);

      if (stat.isFile()) {
        client.put(source, dest, function(err) {
          if (err)
            reject(err);
          else
            resolve();
        });
      } else if (stat.isDirectory()) {
        client.mkdir(dest, true, function(err) {
          if (err)
            return reject(err);
          
          fs.readdir(source, function(err, files) {
            if (err)
              return reject(err);

            function serialPut(list, cb) {
              if (!list.length)
                return cb();

              var file = list.pop();
              recursivePut(client, source + '/' + file, dest + '/' + file)
              .then(function() {
                serialPut(list, cb);
              });
            }

            serialPut(files, resolve);
          });
        });
      } else {
        reject(new Error('Couldn\'t handle file type ' + file.type));
      }
    });
  });

  return promise;
}

function Connection(client) {
  function kick(local, target) {
    var promise = Promise(function(resolve, reject) {
      function putAndEnd() {
        recursivePut(client, local, target).then(function() {
          client.end();
          resolve();
        }, reject);
      }

      client.list(target, function(err, list) {
        if (!err) {
          // Target folder doesn't exist - let's upload
          putAndEnd();
        } else {
          // Target folder already exists, so we delete it, and upload again
          recursiveRemove(client, target).then(putAndEnd);
        }
      });
    });

    return promise;
  }

  this.kick = kick;
}

module.exports = Connection

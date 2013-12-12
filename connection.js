var fs = require('fs')
  , os = require('os')
  , path = require('path')
  , Promise = require('promise');

function walk(p, uploaded, cb) {
  var pending = 0, changed = [];
  uploaded = uploaded || {}

  fs.readdir(p, function(err, files) {
    if (err) return cb(err);
    pending = files.length;

    files.forEach(function(file) {

      file = path.join(p, file);
      fs.stat(file, function(err, stat) {
        if (err) return cb(err);

        if (stat.isFile()) {
          var time = file in uploaded ? (new Date(uploaded[file])).getTime() : 0;
          var ctime = stat.ctime.getTime();

          // File has changed if we have no record of it, or the ctime is
          // newer than in the checkfile
          if (!(time && ctime <= time))
            changed.push({ file: file, ctime: ctime });

          if (!--pending) cb(null, changed);
        } else if (stat.isDirectory()) {
          walk(file, uploaded, function(err, otherChanged) {
            if (err) return cb(err);
            changed = changed.concat(otherChanged);

            if (!--pending) cb(null, changed);
          });
        }
      });
    });
  });
}

function tmpCheckfile(checkfile) {
  return path.join(os.tmpdir(), checkfile);
}

function Connection(client, checkfile) {
  this.client = client;
}

Connection.prototype.disconnect = function() {
  this.client.end();
}

Connection.prototype._collect = function(p) {
  var promise = Promise(function(resolve, reject) {
    function walkin(uploaded) {
      walk(p, uploaded, function(err, files) {
        if (err)
          reject(err);
        else
          resolve(files);
      });
    }

    if (this.checkfile) {
      var tmp = tmpCheckfile(this.checkfile);

      fs.readFile(tmp, { encoding: 'utf8' }, function(err, data) {
        var uploaded = err ? {} : JSON.parse(data).files;
        this._uploaded = uploaded;

        walkin(uploaded);
      }.bind(this));
    } else {
      walkin();
    }
  }.bind(this));

  return promise;
}

Connection.prototype.kick = function(local, dest, checkfile) {
  this.checkfile = checkfile;
  var self = this;
  client = this.client;

  function upload(file) {
    var destination = path.join(dest, path.relative(local, file));

    console.log('Uploading file: ', destination);
    var promise = Promise(function(resolve, reject) {
      client.put(file, destination, false, function(err) {
        if (err)
          reject(err);
        else
          resolve(destination);
      });
    });

    return promise;
  }

  var promise = Promise(function(resolve, reject) {
    var uploaded = 0, number;

    function saveCheckfile(changed) {
      // If we have a checkfile, then we want to append this destination
      // so that we don't have to upload it redundantly later
      if (checkfile) {
        uploaded = self._uploaded || {}
        changed.forEach(function(file) {
          uploaded[file.file] = file.ctime;
        });

        var data = JSON.stringify({ files: uploaded });
        var tmpfile = tmpCheckfile(checkfile);
        fs.writeFile(tmpfile, data, function(err) {
          if (err)
            reject(err);
          else {
            console.log('Successfully saved checkfile "' + tmpfile + '"');
            resolve(changed);
          }
        });
      }

      resolve(changed);
    }

    self._collect(local, checkfile)
      .then(function(files) {
        number = files.length;
        if (!number) return resolve([]);

        files.forEach(function(file) {
          // Upload each file asynchronously
          upload(file.file).then(function(destination) {
            uploaded++;
            console.log('Successfully uploaded: ', destination);

            if (uploaded === number)
              saveCheckfile(files);
          }, function(err) {
            reject(err);
          });
        });
      });
  });

  return promise;
}

module.exports = Connection

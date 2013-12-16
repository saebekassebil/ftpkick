# ftpkick

Simply a module that kicks your folder out the door and up onto
your FTP server of choice. If you don't like the word "kick", then you're allowed
to silently replace it with "deploy" in your mind.

    $ npm install ftpkick

This module was heavily inspired by some code written by @jarl-dk in
CoffeeScript.

## Example

```javascript
var ftpkick = require('ftpkick');

var args = {
  host: 'mytesthost',
  user: 'developer',
  password: 'supersecret'
};

ftpkick.connect(args).then(function(kicker) {
  console.log('Uploading to /myfolder');
  kicker.kick('./build', '/myfolder').then(function() {
    console.log('Successfully uploaded to /myfolder');
    kicker.disconnect()
  }, function(e) {
    console.log('Failed to upload', e);
  });

  kicker.on('uploaded', function(file) {
    console.log('Uploaded file: ', file);
  });

  kicker.on('uploading', function(file) {
    console.log('Uploading file: ', file);
  });

  kicker.on('savedcheckfile', function(file) {
    console.log('Saved checkfile with path: ', file);
  });
});
```

## API
### `ftpkick.connect(parameters) -> Promise`

Connection `parameters` are directly passed on to
the [ftp package](https://github.com/mscdex/node-ftp), so go look there for docs.

The `.connect` function returns a [promise](https://github.com/then/promise.git)
of a `Connection` object.

### `Connection#kick(localDirectory, targetDirectory, checkfile) -> Promise`

As you might've guessed, the `localDirectory` is the directory you want to *kick*
while the `targetDirectory` is the target where all your files hopefully will
land.

The `checkfile` parameter, is an optional filename where the `ctime` of all
uploaded files will be stored. If provided `ftpkick` will check against this
file to make sure that it only uploads updated files. The checkfile is stored
in the OS' temporary directory.

The method returns a promise, that will resolve on success and reject on failure

### `Connection#disconnect()`

Call this when you want to end the FTP connection (after a `kick`)

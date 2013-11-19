# ftpkick

Simply a module that kicks your folder out the door and up onto
your FTP server of choice. If you don't like the word "kick", then you're allowed
to silently replace it with "deploy" in your mind.

    $ npm install ftpkick

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
  }, function(e) {
    console.log('Failed to upload', e);
  });
});
```

## API
### `ftpkick.connect(parameters) -> Promise`

Connection `parameters` are directly passed on to
the [ftp package](https://github.com/mscdex/node-ftp), so go look there for docs.

The `.connect` function returns a [promise](https://github.com/then/promise.git)
of an `FTPKickConnection` object with just one method:

### `FTPKickConnection#kick(localDirectory, targetDirectory) -> Promise`

As you might've guessed, the `localDirectory` is the directory you want to *kick*
while the `targetDirectory` is the target where all your files hopefully will
land.

The method returns a promise, that will resolve on success and reject on failure


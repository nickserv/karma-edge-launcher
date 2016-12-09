// Karma Edge Launcher
// =================

// Dependencies
// ------------
var exec = require('child_process').execSync;
var resolve = require('resolve')

// Constructor
function EdgeBrowser (baseBrowserDecorator) {
  baseBrowserDecorator(this)

  this._getOptions = function (url) {
	  console.log('get');
    return [url, '-k']
  }
  var baseOnProcessExit = this._onProcessExit;
   this._onProcessExit = function() {
		exec('taskkill /t /f /im ' + 'MicrosoftEdge.exe');
		this._onProcessExit = baseOnProcessExit;
   }
}

EdgeBrowser.prototype = {
  name: 'Edge',
  DEFAULT_CMD: {
    win32: resolve.sync('edge-launcher/Win32/MicrosoftEdgeLauncher.exe')
  },
  ENV_CMD: 'EDGE_BIN'
}

EdgeBrowser.$inject = ['baseBrowserDecorator']

// Publish di module
// -----------------

module.exports = {
  'launcher:Edge': ['type', EdgeBrowser]
}

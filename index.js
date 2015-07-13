// Karme Edge Launcher
// =================

// Dependencies
// ------------

var urlparse = require('url').parse
var urlformat = require('url').format
var path = require('path')

var EDGE_COMMAND = [
  'PowerShell',
  path.resolve(__dirname, 'start_modern_app.ps1'),
  'Microsoft.MicrosoftEdge_8wekyb3d8bbwe!MicrosoftEdge'
]

// Constructor
function EdgeBrowser (baseBrowserDecorator, logger) {
  baseBrowserDecorator(this)
  var log = logger.create('launcher')
  var edgePid = 0
  this._getOptions = function (url) {
    var urlObj = urlparse(url, true)

    // url.format does not want search attribute
    delete urlObj.search
    url = urlformat(urlObj)

    var ret = EDGE_COMMAND.slice(1).concat(url)
    return ret
  }

  var baseStart = this._start
  this._start = function(url) {
    baseStart(url)
    this._process.stdout.on('data', function(data) {
    var dataStr = data.toString('utf8')
    if (!isNaN(dataStr)) {
      edgePid = dataStr
      log.info('Edge started, pid:', edgePid)
      } else {
        log.error('Script did not output correct PID: ', dataStr, '(', data, ')')
      }
    })
  }

  // since we used script to launch edge process, we need to make sure the actual edge process also gets killed on exit.
  // otherwise when karma wanted to kill edge, it only killed the launcher script
  var baseProcessExit = this._onProcessExit
  this._onProcessExit = function (code, errorOutput) {
    if (edgePid) {
      log.info('killing edge, pid', edgePid)
      try{
        process.kill(edgePid, 'SIGKILL')
      } catch (err) {
        log.warn('process was not running' + err)
      }
      edgePid = 0
    }
    baseProcessExit(code, errorOutput)
  }
}

EdgeBrowser.prototype = {
  name: 'Edge',
  DEFAULT_CMD: {
    win32: EDGE_COMMAND[0]
  },
  ENV_CMD: 'EDGE_BIN'
}

EdgeBrowser.$inject = ['baseBrowserDecorator', 'logger']

// Publish module
// -----------------

module.exports = {
  'launcher:Edge': ['type', EdgeBrowser]
}

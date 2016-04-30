// Karme Edge Launcher
// =================

// Dependencies
// ------------

var path = require('path')
var fs = require('fs')
var urlparse = require('url').parse
var urlformat = require('url').format
var _ = require('lodash')

// Constants
// ---------

var PROCESS_NAME = 'iexplore.exe'

// Find the Edge executable
function getEdgeExe () {
  var suffix = path.join('Internet Explorer', PROCESS_NAME)
  var locations = _.map(_.compact([
    process.env['PROGRAMW6432'],
    process.env['PROGRAMFILES(X86)'],
    process.env['PROGRAMFILES']
  ]), function (prefix) {
    return path.join(prefix, suffix)
  })

  return _.find(locations, function (location) {
    return fs.existsSync(location)
  })
}

// Constructor
function EdgeBrowser (baseBrowserDecorator, args) {
  baseBrowserDecorator(this)

  var flags = args.flags || []

  this._getOptions = function (url) {
    var urlObj = urlparse(url, true)

    // url.format does not want search attribute
    delete urlObj.search
    url = urlformat(urlObj)

    return flags.concat(url)
  }

  // this is to expose the function for unit testing
  this._getEdgeExe = getEdgeExe
}

EdgeBrowser.prototype = {
  name: 'Edge',
  DEFAULT_CMD: {
    win32: getEdgeExe()
  },
  ENV_CMD: 'EDGE_BIN'
}

EdgeBrowser.$inject = ['baseBrowserDecorator', 'args']

// Publish di module
// -----------------

module.exports = {
  'launcher:Edge': ['type', EdgeBrowser]
}

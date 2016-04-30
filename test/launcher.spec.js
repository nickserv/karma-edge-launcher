var path = require('path')
var di = require('di')
var mocks = require('mocks')

describe('launcher', function () {
  var EventEmitter, EdgeLauncher, injector, launcher, module

  beforeEach(function () {
    EventEmitter = require('../node_modules/karma/lib/events').EventEmitter
    EdgeLauncher = mocks.loadFile(path.join(__dirname, '/../index')).module.exports
    module = {
      baseBrowserDecorator: ['value', function () {}],
      emitter: ['value', new EventEmitter()],
      logger: [
        'value', {
          create: function () {
            return {
              error: function () {},
              debug: function () {}
            }
          }
        }
      ],
      args: ['value', []]
    }
  })

  afterEach(function () {
    injector = null
    launcher = null
  })

  describe('exports', function () {
    it('should export launcher:Edge', function (done) {
      expect(EdgeLauncher['launcher:Edge']).to.defined
      done()
    })
  })

  describe('initialization', function () {
    beforeEach(function () {
      injector = new di.Injector([module, EdgeLauncher])
      launcher = injector.get('launcher:Edge')
    })

    it('should initialize name', function (done) {
      expect(launcher.name).to.equal('Edge')
      done()
    })

    it('should initialize ENV_CMD', function (done) {
      expect(launcher.ENV_CMD).to.equal('EDGE_BIN')
      done()
    })

    it('should initialize DEFAULT_CMD.win32', function (done) {
      expect(launcher.DEFAULT_CMD.win32).to.beDefined
      done()
    })
  })

  describe('_getOptions', function () {
    var getOptions

    beforeEach(function () {
      getOptions = function (url, module) {
        injector = new di.Injector([module, EdgeLauncher])
        launcher = injector.get('launcher:Edge')
        return launcher._getOptions('url')
      }
    })

    it('should include args.flags', function (done) {
      var options
      module.args[1] = {
        flags: ['-flag1', '-flag2']
      }
      options = getOptions('url', module)
      expect(options[0]).to.equal('-flag1')
      expect(options[1]).to.equal('-flag2')
      done()
    })

    it('should return url as the last flag', function (done) {
      var options = getOptions('url', module)
      expect(options[options.length - 1]).to.equal('url')
      done()
    })
  })

  describe('locating iexplore.exe', function () {
    var fsMock, win32Location

    beforeEach(function () {
      process.env['PROGRAMW6432'] = path.normalize('/fake/PROGRAMW6432')
      process.env['PROGRAMFILES(X86)'] = path.normalize('/fake/PROGRAMFILES(X86)')
      process.env['PROGRAMFILES'] = path.normalize('/fake/PROGRAMFILES')
      fsMock = mocks.fs.create({
        'folder1': {
          'Internet Explorer': {
            'iexplore.exe': 1
          }
        }
      })

      EdgeLauncher = mocks.loadFile(path.join(__dirname, '/../index'), {
        fs: fsMock
      }).module.exports

      win32Location = function () {
        injector = new di.Injector([module, EdgeLauncher])
        launcher = injector.get('launcher:Edge')
        return launcher._getEdgeExe()
      }
    })

    it('should locate in PROGRAMW6432', function (done) {
      process.env['' + 'PROGRAMW6432'] = path.normalize('/folder1')
      expect(win32Location()).to.equal(path.normalize('/folder1/Internet Explorer/iexplore.exe'))
      done()
    })

    it('should locate in PROGRAMFILES(X86)', function (done) {
      process.env['' + 'PROGRAMFILES(X86)'] = path.normalize('/folder1')
      expect(win32Location()).to.equal(path.normalize('/folder1/Internet Explorer/iexplore.exe'))
      done()
    })

    it('should locate in PROGRAMFILES', function (done) {
      process.env['' + 'PROGRAMFILES'] = path.normalize('/folder1')
      expect(win32Location()).to.equal(path.normalize('/folder1/Internet Explorer/iexplore.exe'))
      done()
    })

    it('should return undefined when not found', function (done) {
      expect(win32Location()).to.equal(void 0)
      done()
    })
  })

  describe('_onProcessExit', function () {
    var childProcessCmd, onProcessExit

    beforeEach(function () {
      onProcessExit = function () {
        var childProcessMock
        childProcessMock = {
          exec: function (cmd, cb) {
            childProcessCmd = cmd
            cb()
          }
        }

        EdgeLauncher = mocks.loadFile(path.join(__dirname, '/../index'), {
          child_process: childProcessMock
        }).module.exports
        injector = new di.Injector([module, EdgeLauncher])
        launcher = injector.get('launcher:Edge')
        launcher._process = {
          pid: 10
        }
        launcher._onProcessExit(1, 2)
      }
    })

    it('should call wmic with process ID', function (done) {
      onProcessExit()
      expect(childProcessCmd).to.equal(
        'wmic.exe Path win32_Process where ' +
        '"Name=\'iexplore.exe\' and CommandLine Like \'%SCODEF:10%\'" call Terminate'
      )
      done()
    })
  })
})

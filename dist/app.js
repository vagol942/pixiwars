// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({1:[function(require,module,exports) {
var __extends = this && this.__extends || function () {
    var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
        d.__proto__ = b;
    } || function (d, b) {
        for (var p in b) {
            if (b.hasOwnProperty(p)) d[p] = b[p];
        }
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
var game = new Phaser.Game(1280, 720, Phaser.AUTO);
var colorSpace = 255 * 255 * 255;
function randomColorHex() {
    return Math.floor(Math.random() * colorSpace);
}
var GameCanvas = /** @class */function () {
    function GameCanvas(width, height) {
        this.height = height;
        this.width = width;
        this.grid = Array(width).fill().map(function () {
            return Array(height).fill();
        });
        this.populateGrid();
    }
    GameCanvas.prototype.populateGrid = function () {
        this.grid = this.grid.map(function (col, i) {
            return col.map(function (el, j) {
                return new GameDot(randomColorHex(), i, j);
            });
        });
    };
    return GameCanvas;
}();
var GameDot = /** @class */function () {
    function GameDot(color, x, y) {
        this.color = color;
        this.x = x;
        this.y = y;
    }
    return GameDot;
}();
var canvasState = /** @class */function (_super) {
    __extends(canvasState, _super);
    function canvasState() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.canvas_HEIGHT = 64;
        _this.canvas_WIDTH = 128;
        return _this;
    }
    canvasState.prototype.init = function () {
        this.canvas = new GameCanvas(this.canvas_WIDTH, this.canvas_HEIGHT);
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignVertically = true;
        this.scale.pageAlignHorizontally = true;
        this.game.stage.backgroundColor = '#090849';
        this.game.stage.disableVisibilityChange = true;
    };
    canvasState.prototype.create = function () {
        var graphics = game.add.graphics(0, 0);
        this.createCanvas(graphics);
        /*
        graphics.beginFill(0x283149)
        graphics.drawRect(0,0, game.world.width, 80);
        graphics.endFill
        */
        var style3 = {
            fill: "#FFF",
            font: "32px Press Start 2P"
        };
        this.add.text(10, 25, "Some Text", style3);
    };
    canvasState.prototype.createCanvas = function (graphics) {
        var _this = this;
        this.canvas.grid.forEach(function (col) {
            return col.forEach(function (dot) {
                return _this.paintDot(graphics, dot);
            });
        });
    };
    canvasState.prototype.paintDot = function (graphics, dot) {
        graphics.beginFill(dot.color);
        graphics.drawRect(dot.x * 10, dot.y * 10 + 80, 10, 10);
        graphics.endFill();
    };
    return canvasState;
}(Phaser.State);
game.state.add('canvasState', canvasState);
game.state.start('canvasState');
},{}],5:[function(require,module,exports) {

var global = (1, eval)('this');
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    accept: function (fn) {
      this._acceptCallback = fn || function () {};
    },
    dispose: function (fn) {
      this._disposeCallback = fn;
    }
  };
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + '40683' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      data.assets.forEach(function (asset) {
        hmrApply(global.require, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.require, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + 'data.error.stack');
    }
  };
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  if (cached && cached.hot._disposeCallback) {
    cached.hot._disposeCallback();
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallback) {
    cached.hot._acceptCallback();
    return true;
  }

  return getParents(global.require, id).some(function (id) {
    return hmrAccept(global.require, id);
  });
}
},{}]},{},[5,1])
//# sourceMappingURL=/dist/app.map
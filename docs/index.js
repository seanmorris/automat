(function() {
  'use strict';

  var globals = typeof global === 'undefined' ? self : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = {}.hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    var val = aliases[name];
    return (val && name !== val) ? expandAlias(val) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (bundle && typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = typeof window === 'undefined' ? this : window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("index.js", function(exports, require, module) {
"use strict";

var _Tag = require("curvature/base/Tag");

var _View = require("curvature/base/View");

var _Bindable = require("curvature/base/Bindable");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var cellSize = 8;
var width = 512 * 0.5;
var height = 288 * 0.5;
var canvas = new _Tag.Tag("<canvas width = \"".concat(width, "\" height = \"").concat(height, "\">")).node;
var active = new _Tag.Tag("<canvas width = \"".concat(width / cellSize, "\" height = \"").concat(height / cellSize, "\">")).node;
var context = canvas.getContext('2d');
var activeContext = active.getContext('2d');
var imageData = new ImageData(width, height);
var activeDataA = new ImageData(width / cellSize, height / cellSize);
var activeDataB = new ImageData(width / cellSize, height / cellSize);

var types = _defineProperty({
  _WATER: [0x00, 0x55, 0xCC, 0xFF],
  _HEAVY: [0x00, 0x22, 0x99, 0xFF],
  _SAND: [0xEE, 0xAA, 0x00, 0xFF],
  _OIL: [0xAA, 0x33, 0x66, 0xFF],
  _SLIME: [0x00, 0xFF, 0x33, 0xFF],
  _LAVA: [0xFF, 0x00, 0x00, 0xFF],
  _STEAM: [0xAA, 0xAA, 0xCC, 0xFF],
  _SNOW: [0xFF, 0xFF, 0xFF, 0xFF],
  _BLANK: [0xAA, 0xAA, 0xAA, 0xFF],
  _FIRE: [0xFF, 0xFF, 0x00, 0xFF],
  _SMOKE: [0x11, 0x33, 0x11, 0xFF],
  _SOLID: [0x00, 0x00, 0x00, 0xFF]
}, "_BLANK", [0x00, 0x00, 0x00, 0x00]);

var totals = _Bindable.Bindable.make({
  particles: 0
});

var totalView = _View.View.from('<div cv-each = "totals:total:name"><div>[[name]]: [[total]]</div></div>', {
  totals: totals
});

var selectedType = types._SAND;

var palletView = _View.View.from('<div class = "pallet" cv-each = "types:type:name"><div><div cv-on = "click(event, type)" class = "typeSelect" data-name = "[[name]]" style = "--type:#[[type|toColor]];"></div></div></div>', {
  totals: totals
});

palletView.toColor = function (c) {
  return c.map(function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
};

palletView.click = function (event, type) {
  return selectedType = type;
};

palletView.args.types = {};
Object.assign(palletView.args.types, types);
var attributes = {
  _WATER: {
    isLiquid: true
  },
  _HEAVY: {
    isLiquid: true
  }
};

var check = function check(pixels, w, x, y) {
  if (y < 0 || y > height - 1 || x < 0 || x > w - 1) {
    return types._SOLID;
  }

  var i = 4 * x + 4 * y * w;
  return pixels.slice(i, i + 4);
};

var pixMatch = function pixMatch(p, c) {
  var o = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  if (p[0 + o] !== c[0]) return false;
  if (p[1 + o] !== c[1]) return false;
  if (p[2 + o] !== c[2]) return false;
  if (p[3 + o] !== c[3]) return false;
  return true;
};

var pixSet = function pixSet(activeMask, img, o, p) {
  img[o + 0] = p[0];
  img[o + 1] = p[1];
  img[o + 2] = p[2];
  img[o + 3] = p[3];
  var x = o / 4 % width;
  var y = Math.trunc(o / 4 / width);
  setActive(activeMask, width, x, y);
};

var setActive = function setActive(activeMask, w, x, y) {
  var xc = Math.trunc(x / cellSize);
  var yc = Math.trunc(y / cellSize);
  var xcMax = Math.trunc(w / cellSize);
  var xcl = xc - 1;
  var xcr = xc + 1;
  var ycu = yc - 1;
  var ycd = yc + 1;
  var ic = 4 * xc + 4 * yc * xcMax;
  var icl = 4 * xcl + 4 * yc * xcMax;
  var icr = 4 * xcr + 4 * yc * xcMax;
  var icu = 4 * xc + 4 * ycu * xcMax;
  var icd = 4 * xc + 4 * ycd * xcMax;
  var iclu = 4 * xcl + 4 * ycu * xcMax;
  var icld = 4 * xcl + 4 * ycd * xcMax;
  var icru = 4 * xcr + 4 * ycu * xcMax;
  var icrd = 4 * xcr + 4 * ycd * xcMax;
  activeMask[ic + 0] = 0xFF;
  activeMask[ic + 1] = 0xFF;
  activeMask[ic + 2] = 0xFF;
  activeMask[ic + 3] = 0xFF;
  activeMask[icu + 0] = activeMask[icu + 0] || 0x80;
  activeMask[icu + 1] = activeMask[icu + 1] || 0x80;
  activeMask[icu + 2] = activeMask[icu + 2] || 0x80;
  activeMask[icu + 3] = activeMask[icu + 3] || 0x80;
  activeMask[icd + 0] = activeMask[icd + 0] || 0x80;
  activeMask[icd + 1] = activeMask[icd + 1] || 0x80;
  activeMask[icd + 2] = activeMask[icd + 2] || 0x80;
  activeMask[icd + 3] = activeMask[icd + 3] || 0x80;

  if (xc > 0) {
    activeMask[icl + 0] = activeMask[icl + 0] || 0x80;
    activeMask[icl + 1] = activeMask[icl + 1] || 0x80;
    activeMask[icl + 2] = activeMask[icl + 2] || 0x80;
    activeMask[icl + 3] = activeMask[icl + 3] || 0x80;
    activeMask[iclu + 0] = activeMask[iclu + 0] || 0x40;
    activeMask[iclu + 1] = activeMask[iclu + 1] || 0x40;
    activeMask[iclu + 2] = activeMask[iclu + 2] || 0x40;
    activeMask[iclu + 3] = activeMask[iclu + 3] || 0x40;
    activeMask[icld + 0] = activeMask[icld + 0] || 0x40;
    activeMask[icld + 1] = activeMask[icld + 1] || 0x40;
    activeMask[icld + 2] = activeMask[icld + 2] || 0x40;
    activeMask[icld + 3] = activeMask[icld + 3] || 0x40;
  }

  if (xc < -1 + xcMax) {
    activeMask[icr + 0] = activeMask[icr + 0] || 0x80;
    activeMask[icr + 1] = activeMask[icr + 1] || 0x80;
    activeMask[icr + 2] = activeMask[icr + 2] || 0x80;
    activeMask[icr + 3] = activeMask[icr + 3] || 0x80;
    activeMask[icru + 0] = activeMask[icru + 0] || 0x40;
    activeMask[icru + 1] = activeMask[icru + 1] || 0x40;
    activeMask[icru + 2] = activeMask[icru + 2] || 0x40;
    activeMask[icru + 3] = activeMask[icru + 3] || 0x40;
    activeMask[icrd + 0] = activeMask[icrd + 0] || 0x40;
    activeMask[icrd + 1] = activeMask[icrd + 1] || 0x40;
    activeMask[icrd + 2] = activeMask[icrd + 2] || 0x40;
    activeMask[icrd + 3] = activeMask[icrd + 3] || 0x40;
  }
};

var move = function move(bytes, out, moved, activeMask, w, x, y, xa, ya) {
  var i = 4 * x + 4 * y * w;
  var ia = 4 * xa + 4 * ya * w;
  if (xa > w) throw new Error("x dest out of bounds. (".concat(x, ")"));
  if (ya > w) throw new Error("y dest out of bounds. (".concat(x, ")"));
  if (moved[i]) return;
  if (moved[ia]) return;
  setActive(activeMask, w, x, y);
  setActive(activeMask, w, xa, ya);
  moved[i] = true;
  moved[ia] = true;
  out[ia + 0] = bytes[i + 0];
  out[ia + 1] = bytes[i + 1];
  out[ia + 2] = bytes[i + 2];
  out[ia + 3] = bytes[i + 3];
  out[i + 0] = bytes[ia + 0];
  out[i + 1] = bytes[ia + 1];
  out[i + 2] = bytes[ia + 2];
  out[i + 3] = bytes[ia + 3]; // bytes[ia + 0] = bytes[i + 0] = 0;
  // bytes[ia + 1] = bytes[i + 1] = 0;
  // bytes[ia + 2] = bytes[i + 2] = 0;
  // bytes[ia + 3] = bytes[i + 3] = 0;
};

var binToName = function binToName(r, g, b, a) {
  return !a ? false : String(r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0') + a.toString(16).padStart(2, '0')).toUpperCase();
};

var chance = function chance(odds) {
  return Math.random() < odds;
};

var update = function update(bytes, w, f) {
  var activeMask = f % 2 ? activeDataA.data : activeDataB.data;
  var activeMaskPrev = f % 2 ? activeDataB.data : activeDataA.data;
  var _totals = {};
  var out = new Uint8ClampedArray(bytes);
  var moved = new Uint8ClampedArray(bytes.length); // if(f % 10 === 0)
  // {
  // 	for(let j = 0; j < 128; j += 8)
  // 	{
  // 		pixSet(activeMask, out, 4 * (j + 64), types._SNOW);
  // 		// moved[j] = true;
  // 	}
  // }

  for (var j = activeMask.length; j -= 4;) {
    activeMask[j - 1] = activeMask[j - 1] <= 16 ? 0 : activeMask[j - 1] - 16;
  }

  var reversed = chance(0.5);
  var start = reversed ? bytes.length : 0;
  var end = reversed ? 0 : bytes.length;
  var inc = reversed ? -4 : 4;

  for (var i = start; inc > 0 ? i < end : i > end; i += inc) {
    var _totals$particles;

    var a = bytes[i + 3];
    _totals.particles = 1 + ((_totals$particles = _totals.particles) !== null && _totals$particles !== void 0 ? _totals$particles : 0);
    var r = bytes[i + 0];
    var g = bytes[i + 1];
    var b = bytes[i + 2];
    var x = i / 4 % w;
    var y = Math.trunc(i / 4 / w);
    var xc = Math.trunc(x / cellSize);
    var yc = Math.trunc(y / cellSize);
    var ic = 4 * xc + 4 * yc * Math.trunc(w / cellSize);

    if (f > 1 && !activeMaskPrev[ic + 3]) {
      i += cellSize * inc;
      continue;
    }

    if (!a) continue;
    var levelL = check(bytes, w, x - 1, y);
    var levelR = check(bytes, w, x + 1, y);
    var levelLN = check(out, w, x - 1, y);
    var levelRN = check(out, w, x + 1, y);
    var levelLL = check(bytes, w, x - 2, y);
    var levelRR = check(bytes, w, x + 2, y);
    var levelLLN = check(out, w, x - 2, y);
    var levelRRN = check(out, w, x + 2, y);
    var above = check(bytes, w, x + 0, y - 1);
    var below = check(bytes, w, x + 0, y + 1);
    var belowL = check(bytes, w, x - 1, y + 1);
    var belowR = check(bytes, w, x + 1, y + 1);
    var aboveL = check(bytes, w, x - 1, y - 1);
    var aboveR = check(bytes, w, x + 1, y - 1);
    var aboveN = check(out, w, x + 0, y - 1);
    var belowN = check(out, w, x + 0, y + 1);
    var belowLN = check(out, w, x - 1, y + 1);
    var belowRN = check(out, w, x + 1, y + 1);
    var aboveLN = check(out, w, x - 1, y - 1);
    var aboveRN = check(out, w, x + 1, y - 1); // Fire

    if (pixMatch(bytes, types._FIRE, i)) {
      if (!below[3] && !belowN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)) {
        pixSet(activeMask, out, i, types._SMOKE);
        moved[i] = true;
      } else if (chance(0.95) && pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL)) {
        pixSet(activeMask, bytes, i + 4 * -w, types._FIRE);
        pixSet(activeMask, out, i + 4 * -w, types._FIRE);
        moved[i + 4 * -w] = true;
      } else if (chance(0.25) && pixMatch(below, types._OIL) && pixMatch(belowN, types._OIL)) {
        pixSet(activeMask, bytes, i + 4 * w, types._FIRE);
        pixSet(activeMask, out, i + 4 * w, types._FIRE);
        moved[i + 4 * w] = true;
      } else if (chance(0.5) && pixMatch(levelL, types._OIL) && pixMatch(levelLN, types._OIL)) {
        pixSet(activeMask, bytes, i - 4, types._FIRE);
        pixSet(activeMask, out, i - 4, types._FIRE);
        moved[i - 4] = true;
      } else if (chance(0.5) && pixMatch(levelR, types._OIL) && pixMatch(levelRN, types._OIL)) {
        pixSet(activeMask, bytes, i + 4, types._FIRE);
        pixSet(activeMask, out, i + 4, types._FIRE);
        moved[i + 4] = true;
      } else if (chance(0.02) && pixMatch(below, types._FIRE) && pixMatch(belowN, types._FIRE)) {
        pixSet(activeMask, out, i, types._SMOKE);
        moved[i] = true;
      } else if (chance(0.01) && !(pixMatch(above, types._FIRE) && pixMatch(aboveN, types._FIRE))) {
        pixSet(activeMask, out, i, types._SMOKE);
        moved[i] = true;
      }
    } // Smoke


    if (pixMatch(bytes, types._SMOKE, i)) {
      if (pixMatch(above, types._LAVA) && pixMatch(aboveN, types._LAVA)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._SAND) && pixMatch(aboveN, types._SAND)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._SLIME) && pixMatch(aboveN, types._SLIME)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (chance(0.05) && !below[3] && !belowN[3] && pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM) && pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)) {
        pixSet(activeMask, out, i, types._SLIME);
        moved[i] = true;
      } // else if(chance(0.75)
      // 	&& pixMatch(levelL, types._STEAM)
      // 	&& pixMatch(levelR, types._STEAM)
      // 	&& pixMatch(levelLN, types._STEAM)
      // 	&& pixMatch(levelRN, types._STEAM)
      // 	&& pixMatch(levelLL, types._STEAM)
      // 	&& pixMatch(levelRR, types._STEAM)
      // 	&& pixMatch(levelLLN, types._STEAM)
      // 	&& pixMatch(levelRRN, types._STEAM)
      // ){
      // 	move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.5)?-1:1)*(chance(0.75)?2:1), y);
      // }
      // else if(chance(0.3) && pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM) && pixMatch(levelLL, types._STEAM) && pixMatch(levelLLN, types._STEAM))
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.75)?2:1), y);
      // }
      // else if(chance(0.3) && pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM) && pixMatch(levelRR, types._STEAM) && pixMatch(levelRRN, types._STEAM))
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.75)?2:1), y);
      // }
      else if (pixMatch(levelL, types._STEAM) && pixMatch(levelR, types._STEAM) && pixMatch(levelLN, types._STEAM) && pixMatch(levelRN, types._STEAM)) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y);
      } else if (chance(0.3) && pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if (chance(0.3) && pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      } else if (!aboveL[3] && !aboveLN[3] && !aboveR[3] && !aboveRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y - 1);
      } else if (chance(0.5) && !aboveL[3] && !aboveLN[3] && chance(0.5)) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y - 1);
      } else if (chance(0.5) && !aboveR[3] && !aboveRN[3] && chance(0.5)) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y - 1);
      } else if (!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.5) ? -1 : 1), y);
      } else if (chance(0.5) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.04) ? 1 : 2), y);
      } else if (chance(0.5) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.04) ? 1 : 2), y);
      }
    } // Snow


    if (pixMatch(bytes, types._SNOW, i)) {
      // if(pixMatch(above, types._LAVA) && pixMatch(aboveN, types._LAVA))
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
      // }
      // else if(pixMatch(above, types._SAND) && pixMatch(aboveN, types._SAND))
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
      // }
      // else if(pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL))
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
      // }
      if (chance(0.1) && pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)) {
        pixSet(activeMask, out, i, types._WATER);
        moved[i] = true;
      } else if (chance(0.1) && pixMatch(levelL, types._WATER) && pixMatch(levelLN, types._WATER)) {
        pixSet(activeMask, out, i, types._WATER);
        moved[i] = true;
      } else if (chance(0.1) && pixMatch(levelL, types._WATER) && pixMatch(levelRN, types._WATER)) {
        pixSet(activeMask, out, i, types._WATER);
        moved[i] = true;
      } else if (chance(0.1) && pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)) {
        pixSet(activeMask, out, i, types._WATER);
        moved[i] = true;
      } // else if(pixMatch(above, types._SLIME) && pixMatch(aboveN, types._SLIME))
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x, y - 1);
      // }
      else if (chance(0.7) && !below[3] && !belowN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (chance(0.7) && !belowL[3] && !belowLN[3] && !belowR[3] && !belowRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y - 1);
      } else if (chance(0.7) && !belowL[3] && !belowLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y - 1);
      } else if (chance(0.7) && !belowR[3] && !belowRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y - 1);
      } // else if(!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3])
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.5)?-1:1), y);
      // }
      // else if(chance(0.5) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3])
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x - (chance(0.04)?1:2), y);
      // }
      // else if(chance(0.5) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3])
      // {
      // 	move(bytes, out, moved, activeMask,  w, x, y, x + (chance(0.04)?1:2), y);
      // }
      // else if(chance(0.01) 
      // 	&& !below[3]
      // 	&& !belowN[3]
      // 	&& pixMatch(above, types._STEAM) && pixMatch(aboveN, types._STEAM)
      // 	&& pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)
      // 	&& pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)
      // ){
      // 	pixSet(activeMask, out, i, types._WATER);
      // 	moved[i] = true;
      // }
      // else if(chance(0.005) 
      // 	&& !below[3]
      // 	&& !belowN[3]
      // 	&& pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM)
      // 	&& pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)
      // ){
      // 	pixSet(activeMask, out, i, types._WATER);
      // 	moved[i] = true;
      // }

    } // Steam


    if (pixMatch(bytes, types._STEAM, i)) {
      if (pixMatch(above, types._LAVA) && pixMatch(aboveN, types._LAVA)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._SAND) && pixMatch(aboveN, types._SAND)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (pixMatch(above, types._SLIME) && pixMatch(aboveN, types._SLIME)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (chance(0.7) && !above[3] && !aboveN[3] && chance(0.5)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (chance(0.7) && !aboveL[3] && !aboveLN[3] && !aboveR[3] && !aboveRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y - 1);
      } else if (chance(0.7) && !aboveL[3] && !aboveLN[3] && chance(0.5)) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y - 1);
      } else if (chance(0.7) && !aboveR[3] && !aboveRN[3] && chance(0.5)) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y - 1);
      } else if (!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.5) ? -1 : 1), y);
      } else if (chance(0.5) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.04) ? 1 : 2), y);
      } else if (chance(0.5) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.04) ? 1 : 2), y);
      } else if (chance(0.01) && !below[3] && !belowN[3] && pixMatch(above, types._STEAM) && pixMatch(aboveN, types._STEAM) && pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM) && pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)) {
        pixSet(activeMask, out, i, types._WATER);
        moved[i] = true;
      } else if (chance(0.005) && !below[3] && !belowN[3] && pixMatch(levelL, types._STEAM) && pixMatch(levelLN, types._STEAM) && pixMatch(levelR, types._STEAM) && pixMatch(levelRN, types._STEAM)) {
        pixSet(activeMask, out, i, types._WATER);
        moved[i] = true;
      }
    } // Oil


    if (pixMatch(bytes, types._OIL, i)) {
      if (!below[3] && !belowN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.5) ? -1 : 1), y);
      } else if (!levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.04) ? 1 : 2), y);
      } else if (!levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.04) ? 1 : 2), y);
      } else if (!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + Math.sign(-0.5 + Math.random()), y + 1);
      } else if (!belowL[3] && !belowLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y + 1);
      } else if (!belowR[3] && !belowRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y + 1);
      } else if (!levelL[3] && !levelLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if (!levelR[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      }
    } // SLIME


    if (pixMatch(bytes, types._SLIME, i)) {
      if (!below[3] && !belowN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (chance(0.9) && pixMatch(below, types._SAND) && pixMatch(belowN, types._SAND)) {} else if (!belowL[3] && !belowLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y + 1);
      } else if (!belowR[3] && !belowRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y + 1);
      } else if (!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + Math.sign(-0.5 + Math.random()), y);
      } else if ((pixMatch(levelL, types._OIL) || pixMatch(levelL, types._WATER) || pixMatch(levelL, types._HEAVY)) && (pixMatch(levelR, types._OIL) || pixMatch(levelR, types._WATER) || pixMatch(levelR, types._HEAVY)) && (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER) || pixMatch(levelLN, types._HEAVY)) && (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER) || pixMatch(levelRN, types._HEAVY))) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y);
      } else if ((pixMatch(levelL, types._OIL) || pixMatch(levelL, types._WATER) || pixMatch(levelL, types._HEAVY)) && (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER) || pixMatch(levelLN, types._HEAVY)) && (pixMatch(levelLLN, types._OIL) || pixMatch(levelLLN, types._WATER) || pixMatch(levelLLN, types._HEAVY))) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if ((pixMatch(levelR, types._OIL) || pixMatch(levelR, types._WATER) || pixMatch(levelR, types._HEAVY)) && (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER) || pixMatch(levelRN, types._HEAVY)) && (pixMatch(levelRRN, types._OIL) || pixMatch(levelRRN, types._WATER) || pixMatch(levelRRN, types._HEAVY))) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      } else if (chance(0.35) && (pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER) || pixMatch(above, types._HEAVY) && pixMatch(aboveN, types._HEAVY))) {
        move(bytes, out, moved, activeMask, w, x, y, x, y - 1);
      } else if (chance(0.75) && pixMatch(belowL, types._OIL) && pixMatch(belowLN, types._OIL) || pixMatch(belowL, types._WATER) && pixMatch(belowLN, types._WATER) || pixMatch(belowL, types._HEAVY) && pixMatch(belowLN, types._HEAVY)) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y + 1);
      } else if (chance(0.75) && pixMatch(belowR, types._OIL) && pixMatch(belowRN, types._OIL) || pixMatch(belowR, types._WATER) && pixMatch(belowRN, types._WATER) || pixMatch(belowR, types._HEAVY) && pixMatch(belowRN, types._HEAVY)) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y + 1);
      } else if (chance(0.2) && !levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.5) ? -1 : 1), y);
      } else if (chance(0.01) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.04) ? 1 : 2), y);
      } else if (chance(0.01) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.04) ? 1 : 2), y);
      } else if (chance(0.02) && !levelL[3] && !levelLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if (chance(0.02) && !levelR[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      }
    } // Salt Water		


    if (pixMatch(bytes, types._HEAVY, i)) {
      if (!belowN[3] || pixMatch(belowN, types._OIL) || chance(0.05) && pixMatch(belowN, types._WATER)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.5) ? -1 : 1), y);
      } else if ((pixMatch(levelL, types._OIL) || pixMatch(levelL, types._WATER)) && (pixMatch(levelR, types._OIL) || pixMatch(levelR, types._WATER)) && (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER)) && (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER))) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y);
      } else if ((pixMatch(levelL, types._OIL) || pixMatch(levelL, types._WATER)) && (pixMatch(levelLN, types._OIL) || pixMatch(levelLN, types._WATER)) && (pixMatch(levelLLN, types._OIL) || pixMatch(levelLLN, types._WATER))) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if ((pixMatch(levelR, types._OIL) || pixMatch(levelR, types._WATER)) && (pixMatch(levelRN, types._OIL) || pixMatch(levelRN, types._WATER)) && (pixMatch(levelRRN, types._OIL) || pixMatch(levelRRN, types._WATER))) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      } else if (!belowLN[3] || pixMatch(belowLN, types._OIL) || pixMatch(belowLN, types._WATER)) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y + 1);
      } else if (!belowRN[3] || pixMatch(belowRN, types._OIL) || pixMatch(belowRN, types._WATER)) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y + 1);
      } else if (!levelL[3] && !levelLN[3] && !levelLLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.1) ? 1 : 2), y);
      } else if (!levelR[3] && !levelRN[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.1) ? 1 : 2), y);
      } else if (!levelL[3] && !levelLN[3] && chance(0.25)) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if (!levelR[3] && !levelRN[3] && chance(0.25)) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      } else if (!above[3] && chance(0.4 * 2) || chance(0.25 * 2)) {
        if (pixMatch(levelL, types._SAND) && pixMatch(levelLN, types._SAND) && pixMatch(belowL, types._SAND)) {
          move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
        } else if (pixMatch(levelR, types._SAND) && pixMatch(levelRN, types._SAND) && pixMatch(belowR, types._SAND)) {
          move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
        }
      }
    } // Water		


    if (pixMatch(bytes, types._WATER, i)) {
      var coinFlip = chance(0.5);

      if (!below[3] && !belowN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (!above[3] && !aboveN[3] && pixMatch(below, types._SAND) && pixMatch(belowN, types._SAND) && !belowL[3] && !belowLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y + 1, x - 1, y + 1);
      } else if (!above[3] && !aboveN[3] && pixMatch(below, types._SAND) && pixMatch(belowN, types._SAND) && !belowR[3] && !belowRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y + 1, x + 1, y + 1);
      } else if (pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3] && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.1) ? 1 : 2) * (chance(0.5) ? -1 : 1), y);
      } else if (coinFlip && pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.1) ? 1 : 2), y);
      } else if (!coinFlip && pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.1) ? 1 : 2), y);
      } else if (!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y);
      } else if (coinFlip && !pixMatch(above, types._SAND) && !pixMatch(aboveN, types._SAND) && !levelL[3] && !levelLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if (!coinFlip && !pixMatch(above, types._SAND) && !pixMatch(aboveN, types._SAND) && !levelR[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      } else if (pixMatch(below, types._OIL) && pixMatch(belowN, types._OIL)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (pixMatch(levelL, types._OIL) && pixMatch(levelR, types._OIL) && pixMatch(levelLN, types._OIL) && pixMatch(levelRN, types._OIL)) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y);
      } else if (pixMatch(levelL, types._OIL) && pixMatch(levelLN, types._OIL) && pixMatch(levelLL, types._OIL) && pixMatch(levelLLN, types._OIL)) {
        move(bytes, out, moved, activeMask, w, x - 1, y, x, y);
      } else if (pixMatch(levelR, types._OIL) && pixMatch(levelRN, types._OIL) && pixMatch(levelRR, types._OIL) && pixMatch(levelRRN, types._OIL)) {
        move(bytes, out, moved, activeMask, w, x + 1, y, x, y);
      } else if (coinFlip && !above[3] && !aboveN[3] && (!belowL[3] || pixMatch(belowL, types._OIL)) && (!belowLN[3] || pixMatch(belowLN, types._OIL))) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y + 1);
      } else if (!coinFlip && !above[3] && !aboveN[3] && (!belowR[3] || pixMatch(belowR, types._OIL)) && (!belowRN[3] || pixMatch(belowRN, types._OIL))) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y + 1);
      } else if (!pixMatch(above, types._SAND) && !pixMatch(aboveN, types._SAND) && (!above[3] && chance(0.01) || chance(0.1))) {
        if (pixMatch(levelL, types._SAND) && pixMatch(levelR, types._SAND) && pixMatch(levelLN, types._SAND) && pixMatch(levelRN, types._SAND)) {
          move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.5) ? -1 : 1), y);
        } else if (coinFlip && pixMatch(levelL, types._SAND) && pixMatch(levelLN, types._SAND)) {
          move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
        } else if (!coinFlip && pixMatch(levelR, types._SAND) && pixMatch(levelRN, types._SAND)) {
          move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
        }
      }
    } // Sand


    if (pixMatch(bytes, types._SAND, i)) {
      if (!below[3] && !belowN[3] || pixMatch(below, types._WATER) && pixMatch(belowN, types._WATER) || pixMatch(below, types._HEAVY) && pixMatch(belowN, types._HEAVY) || pixMatch(below, types._OIL) && pixMatch(belowN, types._OIL)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (chance(0.2)) {
        if (!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3]) {
          move(bytes, out, moved, activeMask, w, x, y, x + Math.sign(-0.5 + Math.random()), y);
        } else if (!above[3] && chance(0.3) || chance(0.02)) {
          if (!belowL[3] && !belowLN[3] && !levelL[3] && !levelLN[3]) {
            move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
          } else if (!belowR[3] && !belowRN[3] && !levelR[3] && !levelRN[3]) {
            move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
          }
        }
      }
    } // Lava


    if (pixMatch(bytes, types._LAVA, i)) {
      if (chance(0.75) && pixMatch(above, types._WATER) && pixMatch(aboveN, types._WATER)) {
        pixSet(activeMask, bytes, i + 4 * -w, types._STEAM);
        pixSet(activeMask, out, i + 4 * -w, types._STEAM);
        moved[i + 4 * -w] = true;
      } else if (chance(0.75) && pixMatch(levelL, types._WATER) && pixMatch(levelLN, types._WATER)) {
        pixSet(activeMask, bytes, i - 4, types._STEAM);
        pixSet(activeMask, out, i - 4, types._STEAM);
        moved[i - 4] = true;
      } else if (chance(0.75) && pixMatch(levelR, types._WATER) && pixMatch(levelRN, types._WATER)) {
        pixSet(activeMask, bytes, i + 4, types._STEAM);
        pixSet(activeMask, out, i + 4, types._STEAM);
        moved[i + 4] = true;
      } else if (pixMatch(below, types._SLIME) && pixMatch(belowN, types._SLIME)) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (pixMatch(above, types._OIL) && pixMatch(aboveN, types._OIL)) {
        pixSet(activeMask, bytes, i + 4 * -w, types._FIRE);
        pixSet(activeMask, out, i + 4 * -w, types._FIRE);
        moved[i + 4 * -w] = true;
      } else if (pixMatch(levelL, types._OIL) && pixMatch(levelLN, types._OIL)) {
        pixSet(activeMask, bytes, i - 4, types._FIRE);
        pixSet(activeMask, out, i - 4, types._FIRE);
        moved[i - 4] = true;
      } else if (pixMatch(levelR, types._OIL) && pixMatch(levelRN, types._OIL)) {
        pixSet(activeMask, bytes, i + 4, types._FIRE);
        pixSet(activeMask, out, i + 4, types._FIRE);
        moved[i + 4] = true;
      } else if (!below[3] && !belowN[3] || (pixMatch(below, types._WATER) || pixMatch(below, types._HEAVY) || pixMatch(below, types._OIL)) && (pixMatch(belowN, types._WATER) || pixMatch(belowN, types._HEAVY) || pixMatch(belowN, types._OIL))) {
        move(bytes, out, moved, activeMask, w, x, y, x, y + 1);
      } else if (chance(0.9)) {
        if (!belowL[3] && !belowR[3] && !belowLN[3] && !belowRN[3] && !levelL[3] && !levelLN[3] && !levelR[3] && !levelRN[3]) {
          move(bytes, out, moved, activeMask, w, x, y, x + Math.sign(-0.5 + Math.random()), y);
        } else if (!above[3] && chance(0.5) || chance(0.05)) {
          if ((!levelL[3] && !levelLN[3] || pixMatch(levelL, types._SLIME) && pixMatch(levelLN, types._SLIME)) && (!belowL[3] && !belowLN[3] || pixMatch(belowL, types._SLIME) && pixMatch(belowLN, types._SLIME))) {
            move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
          } else if ((!levelR[3] && !levelRN[3] || pixMatch(levelR, types._SLIME) && pixMatch(levelRN, types._SLIME)) && (!belowR[3] && !belowRN[3] || pixMatch(belowR, types._SLIME) && pixMatch(belowRN, types._SLIME))) {
            move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
          }
        }
      } else if (!levelL[3] && !levelR[3] && !levelLN[3] && !levelRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.5) ? -1 : 1), y);
      } else if (chance(0.04) && !levelL[3] && !levelLN[3] && !levelLL[3] && !levelLLN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x - (chance(0.04) ? 1 : 2), y);
      } else if (chance(0.04) && !levelR[3] && !levelRN[3] && !levelRR[3] && !levelRRN[3]) {
        move(bytes, out, moved, activeMask, w, x, y, x + (chance(0.04) ? 1 : 2), y);
      } else if (chance(0.04) && !levelL[3] && !levelLN[3] || pixMatch(levelL, types._SLIME) && pixMatch(levelLN, types._SLIME)) {
        move(bytes, out, moved, activeMask, w, x, y, x - 1, y);
      } else if (chance(0.04) && !levelR[3] && !levelRN[3] || pixMatch(levelR, types._SLIME) && pixMatch(levelRN, types._SLIME)) {
        move(bytes, out, moved, activeMask, w, x, y, x + 1, y);
      }
    }
  }

  bytes.set(out);

  for (var _i in _totals) {
    _totals[_i] = 0;
  }

  for (var _i2 in totals) {
    _totals[_i2] = 0;
  }

  for (var _i3 = 0; _i3 < out.length; _i3 += 4) {
    if (!out[_i3 + 3]) continue;
    _totals.particles++;

    if (pixMatch(bytes, types._STEAM, _i3)) {
      var _totals$steam, _totals$water;

      _totals.steam = 1 + ((_totals$steam = _totals.steam) !== null && _totals$steam !== void 0 ? _totals$steam : 0);
      _totals.water = 1 + ((_totals$water = _totals.water) !== null && _totals$water !== void 0 ? _totals$water : 0);
    }

    if (pixMatch(bytes, types._WATER, _i3)) {
      var _totals$freshWater, _totals$water2;

      _totals.freshWater = 1 + ((_totals$freshWater = _totals.freshWater) !== null && _totals$freshWater !== void 0 ? _totals$freshWater : 0);
      _totals.water = 1 + ((_totals$water2 = _totals.water) !== null && _totals$water2 !== void 0 ? _totals$water2 : 0);
    }

    if (pixMatch(bytes, types._SAND, _i3)) {
      var _totals$sand;

      _totals.sand = 1 + ((_totals$sand = _totals.sand) !== null && _totals$sand !== void 0 ? _totals$sand : 0);
    }

    if (pixMatch(bytes, types._LAVA, _i3)) {
      var _totals$lava;

      _totals.lava = 1 + ((_totals$lava = _totals.lava) !== null && _totals$lava !== void 0 ? _totals$lava : 0);
    }

    if (pixMatch(bytes, types._OIL, _i3)) {
      var _totals$oil;

      _totals.oil = 1 + ((_totals$oil = _totals.oil) !== null && _totals$oil !== void 0 ? _totals$oil : 0);
    }

    if (pixMatch(bytes, types._SLIME, _i3)) {
      var _totals$slime;

      _totals.slime = 1 + ((_totals$slime = _totals.slime) !== null && _totals$slime !== void 0 ? _totals$slime : 0);
    }

    if (pixMatch(bytes, types._FIRE, _i3)) {
      var _totals$fire;

      _totals.fire = 1 + ((_totals$fire = _totals.fire) !== null && _totals$fire !== void 0 ? _totals$fire : 0);
    }

    if (pixMatch(bytes, types._SMOKE, _i3)) {
      var _totals$smoke;

      _totals.smoke = 1 + ((_totals$smoke = _totals.smoke) !== null && _totals$smoke !== void 0 ? _totals$smoke : 0);
    }
  }

  Object.assign(totals, _totals);
};

var buttonDown = false;

var addParticle = function addParticle(event) {
  var rect = event.target.getBoundingClientRect();
  var xs = event.clientX - rect.left;
  var ys = event.clientY - rect.top;
  var ws = rect.width;
  var hs = rect.height;
  var x = Math.floor(width * xs / ws);
  var y = Math.floor(height * ys / hs);
  pixSet(activeDataA.data, imageData.data, 4 * parseInt(x + y * width), selectedType);
};

canvas.addEventListener('mouseup', function (event) {
  return buttonDown = false;
});
canvas.addEventListener('mousedown', function (event) {
  addParticle(event);
  buttonDown = true;
});
canvas.addEventListener('mousemove', function (event) {
  return buttonDown && addParticle(event);
});
document.addEventListener('DOMContentLoaded', function (event) {
  document.body.appendChild(canvas);
  document.body.appendChild(active);
  palletView.render(document.body); // totalView.render(document.body);

  var frame = 0;
  var last = 0;

  var renderLoop = function renderLoop(time) {
    if (time - frame < 16 / 1000) {
      requestAnimationFrame(renderLoop);
    }

    console.time('frame');
    update(imageData.data, width, frame++);
    context.putImageData(imageData, 0, 0);
    activeContext.putImageData(frame % 2 ? activeDataB : activeDataA, 0, 0);
    requestAnimationFrame(renderLoop); // setTimeout(renderLoop, 50);
    // setTimeout(renderLoop, 0);

    console.timeEnd('frame'); // for(let i = 0; i < activeData.data.length; i += 4)
    // {
    // 	activeData.data[i+0] = 0;
    // 	activeData.data[i+1] = 0;
    // 	activeData.data[i+2] = 0;
    // 	activeData.data[i+3] = 0;
    // }
  };

  renderLoop();
});
});

require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');

require('index');
//# sourceMappingURL=index.js.map
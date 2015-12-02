// Early import of 3.x l20n from: https://github.com/stasm/l20n.js/tree/lightweight

(function(e, a) { for(var i in a) e[i] = a[i]; }(this, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _bindingsHtmlIo = __webpack_require__(5);

	var _bindingsHtmlIo2 = _interopRequireDefault(_bindingsHtmlIo);

	var _libEnv = __webpack_require__(7);

	var _libEnv2 = _interopRequireDefault(_libEnv);

	var _bindingsHtmlService = __webpack_require__(4);

	var _bindingsHtmlView = __webpack_require__(1);

	var _bindingsHtmlHead = __webpack_require__(2);

	var _bindingsHtmlLangs = __webpack_require__(15);

	var additionalLangsAtLaunch = (0, _bindingsHtmlLangs.getAdditionalLanguages)();
	var readyStates = {
	  loading: 0,
	  interactive: 1,
	  complete: 2
	};

	function whenInteractive(callback) {
	  if (readyStates[document.readyState] >= readyStates.interactive) {
	    return callback();
	  }

	  document.addEventListener('readystatechange', function l10n_onrsc() {
	    if (readyStates[document.readyState] >= readyStates.interactive) {
	      document.removeEventListener('readystatechange', l10n_onrsc);
	      callback();
	    }
	  });
	}

	function init() {
	  var _this = this;

	  var _getMeta = (0, _bindingsHtmlHead.getMeta)(document.head);

	  var defaultLang = _getMeta.defaultLang;
	  var availableLangs = _getMeta.availableLangs;
	  var appVersion = _getMeta.appVersion;

	  this.env = new _libEnv2['default'](document.URL, defaultLang, _bindingsHtmlIo2['default'].fetch.bind(_bindingsHtmlIo2['default'], appVersion));
	  this.views.push(document.l10n = new _bindingsHtmlView.View(this, document));

	  var setLanguage = function setLanguage(additionalLangs) {
	    return _bindingsHtmlLangs.changeLanguage.call(_this, appVersion, defaultLang, availableLangs, additionalLangs, [], navigator.languages);
	  };

	  this.languages = additionalLangsAtLaunch.then(setLanguage, setLanguage);

	  window.addEventListener('languagechange', function () {
	    return _bindingsHtmlLangs.onlanguagechage.call(_this, appVersion, defaultLang, availableLangs, navigator.languages);
	  });
	  document.addEventListener('additionallanguageschange', function (evt) {
	    return _bindingsHtmlLangs.onadditionallanguageschange.call(_this, appVersion, defaultLang, availableLangs, evt.detail, navigator.languages);
	  });

	  _bindingsHtmlService.L10n.change = _bindingsHtmlLangs.onlanguagechage.bind(this, appVersion, defaultLang, availableLangs);
	}

	whenInteractive(init.bind(window.L10n = _bindingsHtmlService.L10n));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.View = View;

	var _bindingsHtmlHead = __webpack_require__(2);

	var _dom = __webpack_require__(3);

	var observerConfig = {
	  attributes: true,
	  characterData: false,
	  childList: true,
	  subtree: true,
	  attributeFilter: ['data-l10n-id', 'data-l10n-args']
	};

	function View(service, doc) {
	  var _this = this;

	  this.service = service;
	  this.doc = doc;
	  this.ctx = this.service.env.createContext((0, _bindingsHtmlHead.getResourceLinks)(doc.head));

	  this.ready = new Promise(function (resolve) {
	    var viewReady = function viewReady(evt) {
	      doc.removeEventListener('DOMLocalized', viewReady);
	      resolve(evt.detail.languages);
	    };
	    doc.addEventListener('DOMLocalized', viewReady);
	  });

	  var observer = new MutationObserver(onMutations.bind(this));
	  this.observe = function () {
	    return observer.observe(_this.doc, observerConfig);
	  };
	  this.disconnect = function () {
	    return observer.disconnect();
	  };
	}

	View.prototype.formatValue = function (id, args) {
	  return this.ctx.formatValue(this.service.languages, id, args);
	};

	View.prototype.formatEntity = function (id, args) {
	  return this.ctx.formatEntity(this.service.languages, id, args);
	};

	View.prototype.setAttributes = _dom.setL10nAttributes;
	View.prototype.getAttributes = _dom.getL10nAttributes;
	View.prototype.translateFragment = _dom.translateFragment;

	function onMutations(mutations) {
	  var mutation = undefined;
	  var targets = new Set();

	  for (var i = 0; i < mutations.length; i++) {
	    mutation = mutations[i];

	    if (mutation.type === 'childList') {
	      for (var j = 0; j < mutation.addedNodes.length; j++) {
	        var addedNode = mutation.addedNodes[j];
	        if (addedNode.nodeType === Node.ELEMENT_NODE) {
	          targets.add(addedNode);
	        }
	      }
	    }

	    if (mutation.type === 'attributes') {
	      _dom.translateElement.call(this, mutation.target);
	    }
	  }

	  targets.forEach(function (target) {
	    if (target.childElementCount) {
	      _dom.translateFragment.call(this, target);
	    } else if (target.hasAttribute('data-l10n-id')) {
	      _dom.translateElement.call(this, target);
	    }
	  }, this);
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.getResourceLinks = getResourceLinks;
	exports.getMeta = getMeta;

	function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

	function getResourceLinks(head) {
	  return Array.prototype.map.call(head.querySelectorAll('link[rel="localization"]'), function (el) {
	    return el.getAttribute('href');
	  });
	}

	function getMeta(head) {
	  var availableLangs = Object.create(null);
	  var defaultLang = null;
	  var appVersion = null;

	  // XXX take last found instead of first?
	  var els = head.querySelectorAll('meta[name="availableLanguages"],' + 'meta[name="defaultLanguage"],' + 'meta[name="appVersion"]');
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;

	  try {
	    for (var _iterator = els[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var el = _step.value;

	      var _name = el.getAttribute('name');
	      var content = el.getAttribute('content').trim();
	      switch (_name) {
	        case 'availableLanguages':
	          availableLangs = getLangRevisionMap(availableLangs, content);
	          break;
	        case 'defaultLanguage':
	          var _getLangRevisionTuple = getLangRevisionTuple(content),
	              _getLangRevisionTuple2 = _slicedToArray(_getLangRevisionTuple, 2),
	              lang = _getLangRevisionTuple2[0],
	              rev = _getLangRevisionTuple2[1];

	          defaultLang = lang;
	          if (!(lang in availableLangs)) {
	            availableLangs[lang] = rev;
	          }
	          break;
	        case 'appVersion':
	          appVersion = content;
	      }
	    }
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator['return']) {
	        _iterator['return']();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }

	  return {
	    defaultLang: defaultLang,
	    availableLangs: availableLangs,
	    appVersion: appVersion
	  };
	}

	function getLangRevisionMap(seq, str) {
	  return str.split(',').reduce(function (seq, cur) {
	    var _getLangRevisionTuple3 = getLangRevisionTuple(cur);

	    var _getLangRevisionTuple32 = _slicedToArray(_getLangRevisionTuple3, 2);

	    var lang = _getLangRevisionTuple32[0];
	    var rev = _getLangRevisionTuple32[1];

	    seq[lang] = rev;
	    return seq;
	  }, seq);
	}

	function getLangRevisionTuple(str) {
	  // code:revision

	  var _str$trim$split = str.trim().split(':');

	  var _str$trim$split2 = _slicedToArray(_str$trim$split, 2);

	  var lang = _str$trim$split2[0];
	  var rev = _str$trim$split2[1];

	  // if revision is missing, use NaN
	  return [lang, parseInt(rev)];
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.setL10nAttributes = setL10nAttributes;
	exports.getL10nAttributes = getL10nAttributes;
	exports.translateDocument = translateDocument;
	exports.translateFragment = translateFragment;
	exports.translateElement = translateElement;

	var _service = __webpack_require__(4);

	var allowed = {
	  elements: ['a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data', 'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'span', 'br', 'wbr'],
	  attributes: {
	    global: ['title', 'aria-label', 'aria-valuetext', 'aria-moz-hint'],
	    a: ['download'],
	    area: ['download', 'alt'],
	    // value is special-cased in isAttrAllowed
	    input: ['alt', 'placeholder'],
	    menuitem: ['label'],
	    menu: ['label'],
	    optgroup: ['label'],
	    option: ['label'],
	    track: ['label'],
	    img: ['alt'],
	    textarea: ['placeholder'],
	    th: ['abbr']
	  }
	};

	function setL10nAttributes(element, id, args) {
	  element.setAttribute('data-l10n-id', id);
	  if (args) {
	    element.setAttribute('data-l10n-args', JSON.stringify(args));
	  }
	}

	function getL10nAttributes(element) {
	  return {
	    id: element.getAttribute('data-l10n-id'),
	    args: JSON.parse(element.getAttribute('data-l10n-args'))
	  };
	}

	function getTranslatables(element) {
	  var nodes = [];

	  if (typeof element.hasAttribute === 'function' && element.hasAttribute('data-l10n-id')) {
	    nodes.push(element);
	  }

	  return nodes.concat.apply(nodes, element.querySelectorAll('*[data-l10n-id]'));
	}

	function translateDocument(doc, langs) {
	  var setDOMLocalized = function setDOMLocalized() {
	    doc.localized = true;
	    (0, _service.dispatchEvent)(doc, 'DOMLocalized', langs);
	  };

	  doc.documentElement.lang = langs[0].code;
	  doc.documentElement.dir = langs[0].dir;
	  return translateFragment.call(this, doc.documentElement).then(setDOMLocalized, setDOMLocalized);
	}

	function translateFragment(element) {
	  return Promise.all(getTranslatables(element).map(translateElement.bind(this)));
	}

	function camelCaseToDashed(string) {
	  // XXX workaround for https://bugzil.la/1141934
	  if (string === 'ariaValueText') {
	    return 'aria-valuetext';
	  }

	  return string.replace(/[A-Z]/g, function (match) {
	    return '-' + match.toLowerCase();
	  }).replace(/^-/, '');
	}

	function translateElement(element) {
	  var l10n = getL10nAttributes(element);

	  if (!l10n.id) {
	    return false;
	  }

	  return this.formatEntity(l10n.id, l10n.args).then(applyTranslation.bind(this, element));
	}

	function applyTranslation(element, entity) {
	  this.disconnect();

	  var value;
	  if (entity.attrs && entity.attrs.innerHTML) {
	    // XXX innerHTML is treated as value (https://bugzil.la/1142526)
	    value = entity.attrs.innerHTML;
	    console.warn('L10n Deprecation Warning: using innerHTML in translations is unsafe ' + 'and will not be supported in future versions of l10n.js. ' + 'See https://bugzil.la/1027117');
	  } else {
	    value = entity.value;
	  }

	  if (typeof value === 'string') {
	    if (!entity.overlay) {
	      element.textContent = value;
	    } else {
	      // start with an inert template element and move its children into
	      // `element` but such that `element`'s own children are not replaced
	      var translation = element.ownerDocument.createElement('template');
	      translation.innerHTML = value;
	      // overlay the node with the DocumentFragment
	      overlayElement(element, translation.content);
	    }
	  }

	  for (var key in entity.attrs) {
	    var attrName = camelCaseToDashed(key);
	    if (isAttrAllowed({ name: attrName }, element)) {
	      element.setAttribute(attrName, entity.attrs[key]);
	    }
	  }

	  this.observe();
	}

	// The goal of overlayElement is to move the children of `translationElement`
	// into `sourceElement` such that `sourceElement`'s own children are not
	// replaced, but onle have their text nodes and their attributes modified.
	//
	// We want to make it possible for localizers to apply text-level semantics to
	// the translations and make use of HTML entities. At the same time, we
	// don't trust translations so we need to filter unsafe elements and
	// attribtues out and we don't want to break the Web by replacing elements to
	// which third-party code might have created references (e.g. two-way
	// bindings in MVC frameworks).
	function overlayElement(sourceElement, translationElement) {
	  var result = translationElement.ownerDocument.createDocumentFragment();
	  var k, attr;

	  // take one node from translationElement at a time and check it against
	  // the allowed list or try to match it with a corresponding element
	  // in the source
	  var childElement;
	  while (childElement = translationElement.childNodes[0]) {
	    translationElement.removeChild(childElement);

	    if (childElement.nodeType === Node.TEXT_NODE) {
	      result.appendChild(childElement);
	      continue;
	    }

	    var index = getIndexOfType(childElement);
	    var sourceChild = getNthElementOfType(sourceElement, childElement, index);
	    if (sourceChild) {
	      // there is a corresponding element in the source, let's use it
	      overlayElement(sourceChild, childElement);
	      result.appendChild(sourceChild);
	      continue;
	    }

	    if (isElementAllowed(childElement)) {
	      for (k = 0, attr; attr = childElement.attributes[k]; k++) {
	        if (!isAttrAllowed(attr, childElement)) {
	          childElement.removeAttribute(attr.name);
	        }
	      }
	      result.appendChild(childElement);
	      continue;
	    }

	    // otherwise just take this child's textContent
	    result.appendChild(document.createTextNode(childElement.textContent));
	  }

	  // clear `sourceElement` and append `result` which by this time contains
	  // `sourceElement`'s original children, overlayed with translation
	  sourceElement.textContent = '';
	  sourceElement.appendChild(result);

	  // if we're overlaying a nested element, translate the allowed
	  // attributes; top-level attributes are handled in `translateElement`
	  // XXX attributes previously set here for another language should be
	  // cleared if a new language doesn't use them; https://bugzil.la/922577
	  if (translationElement.attributes) {
	    for (k = 0, attr; attr = translationElement.attributes[k]; k++) {
	      if (isAttrAllowed(attr, sourceElement)) {
	        sourceElement.setAttribute(attr.name, attr.value);
	      }
	    }
	  }
	}

	// XXX the allowed list should be amendable; https://bugzil.la/922573
	function isElementAllowed(element) {
	  return allowed.elements.indexOf(element.tagName.toLowerCase()) !== -1;
	}

	function isAttrAllowed(attr, element) {
	  var attrName = attr.name.toLowerCase();
	  var tagName = element.tagName.toLowerCase();
	  // is it a globally safe attribute?
	  if (allowed.attributes.global.indexOf(attrName) !== -1) {
	    return true;
	  }
	  // are there no allowed attributes for this element?
	  if (!allowed.attributes[tagName]) {
	    return false;
	  }
	  // is it allowed on this element?
	  // XXX the allowed list should be amendable; https://bugzil.la/922573
	  if (allowed.attributes[tagName].indexOf(attrName) !== -1) {
	    return true;
	  }
	  // special case for value on inputs with type button, reset, submit
	  if (tagName === 'input' && attrName === 'value') {
	    var type = element.type.toLowerCase();
	    if (type === 'submit' || type === 'button' || type === 'reset') {
	      return true;
	    }
	  }
	  return false;
	}

	// Get n-th immediate child of context that is of the same type as element.
	// XXX Use querySelector(':scope > ELEMENT:nth-of-type(index)'), when:
	// 1) :scope is widely supported in more browsers and 2) it works with
	// DocumentFragments.
	function getNthElementOfType(context, element, index) {
	  /* jshint boss:true */
	  var nthOfType = 0;
	  for (var i = 0, child; child = context.children[i]; i++) {
	    if (child.nodeType === Node.ELEMENT_NODE && child.tagName === element.tagName) {
	      if (nthOfType === index) {
	        return child;
	      }
	      nthOfType++;
	    }
	  }
	  return null;
	}

	// Get the index of the element among siblings of the same type.
	function getIndexOfType(element) {
	  var index = 0;
	  var child;
	  while (child = element.previousElementSibling) {
	    if (child.tagName === element.tagName) {
	      index++;
	    }
	  }
	  return index;
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.initViews = initViews;
	exports.dispatchEvent = dispatchEvent;

	var _dom = __webpack_require__(3);

	var L10n = {
	  views: [],
	  env: null,
	  languages: null
	};

	exports.L10n = L10n;

	function initViews(langs) {
	  return Promise.all(this.views.map(function (view) {
	    return initView(view, langs);
	  }));
	}

	function initView(view, langs) {
	  dispatchEvent(view.doc, 'supportedlanguageschange', langs);
	  return view.ctx.fetch(langs, 1).then(_dom.translateDocument.bind(view, view.doc, langs)).then(function () {
	    return view.observe();
	  });
	}

	function dispatchEvent(root, name, langs) {
	  var event = new CustomEvent(name, {
	    bubbles: false,
	    cancelable: false,
	    detail: {
	      languages: langs
	    }
	  });
	  root.dispatchEvent(event);
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _libErrors = __webpack_require__(6);

	function load(type, url) {
	  return new Promise(function (resolve, reject) {
	    var xhr = new XMLHttpRequest();

	    if (xhr.overrideMimeType) {
	      xhr.overrideMimeType(type);
	    }

	    xhr.open('GET', url, true);

	    if (type === 'application/json') {
	      xhr.responseType = 'json';
	    }

	    xhr.addEventListener('load', function io_onload(e) {
	      if (e.target.status === 200 || e.target.status === 0) {
	        // Sinon.JS's FakeXHR doesn't have the response property
	        resolve(e.target.response || e.target.responseText);
	      } else {
	        reject(new _libErrors.L10nError('Not found: ' + url));
	      }
	    });
	    xhr.addEventListener('error', reject);
	    xhr.addEventListener('timeout', reject);

	    // the app: protocol throws on 404, see https://bugzil.la/827243
	    try {
	      xhr.send(null);
	    } catch (e) {
	      if (e.name === 'NS_ERROR_FILE_NOT_FOUND') {
	        // the app: protocol throws on 404, see https://bugzil.la/827243
	        reject(new _libErrors.L10nError('Not found: ' + url));
	      } else {
	        throw e;
	      }
	    }
	  });
	}

	var io = {
	  extra: function extra(code, ver, path, type) {
	    return navigator.mozApps.getLocalizationResource(code, ver, path, type);
	  },
	  app: function app(code, ver, path, type) {
	    switch (type) {
	      case 'text':
	        return load('text/plain', path);
	      case 'json':
	        return load('application/json', path);
	      default:
	        throw new _libErrors.L10nError('Unknown file type: ' + type);
	    }
	  } };

	exports['default'] = {
	  fetch: function fetch(ver, res, lang) {
	    var url = res.replace('{locale}', lang.code);
	    var type = res.endsWith('.json') ? 'json' : 'text';
	    return io[lang.src](lang.code, ver, url, type);
	  }
	};
	module.exports = exports['default'];

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.L10nError = L10nError;

	function L10nError(message, id, code) {
	  this.name = 'L10nError';
	  this.message = message;
	  this.id = id;
	  this.code = code;
	}

	L10nError.prototype = Object.create(Error.prototype);
	L10nError.prototype.constructor = L10nError;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports['default'] = Env;

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _context = __webpack_require__(9);

	var _context2 = _interopRequireDefault(_context);

	var _resolver = __webpack_require__(10);

	var _formatPropertiesParser = __webpack_require__(12);

	var _formatPropertiesParser2 = _interopRequireDefault(_formatPropertiesParser);

	var _formatL20nParser = __webpack_require__(8);

	var _formatL20nParser2 = _interopRequireDefault(_formatL20nParser);

	var _pseudo = __webpack_require__(13);

	var _events = __webpack_require__(14);

	var parsers = {
	  properties: _formatPropertiesParser2['default'].parse.bind(_formatPropertiesParser2['default']),
	  l20n: _formatL20nParser2['default'].parse.bind(_formatL20nParser2['default']),
	  json: null
	};

	function Env(id, defaultLang, fetch) {
	  this.id = id;
	  this.defaultLang = defaultLang;
	  this.fetch = fetch;

	  this._resMap = Object.create(null);
	  this._resCache = Object.create(null);

	  var listeners = {};
	  this.emit = _events.emit.bind(this, listeners);
	  this.addEventListener = _events.addEventListener.bind(this, listeners);
	  this.removeEventListener = _events.removeEventListener.bind(this, listeners);
	}

	Env.prototype.createContext = function (resIds) {
	  var ctx = new _context2['default'](this, resIds);

	  resIds.forEach(function (res) {
	    if (!this._resMap[res]) {
	      this._resMap[res] = new Set();
	    }
	    this._resMap[res].add(ctx);
	  }, this);

	  return ctx;
	};

	Env.prototype.destroyContext = function (ctx) {
	  var cache = this._resCache;
	  var map = this._resMap;

	  ctx._resIds.forEach(function (resId) {
	    if (map[resId].size === 1) {
	      map[resId].clear();
	      delete cache[resId];
	    } else {
	      map[resId]['delete'](ctx);
	    }
	  });
	};

	Env.prototype._getResource = function (lang, res) {
	  var _this = this;

	  var code = lang.code;
	  var src = lang.src;

	  var cache = this._resCache;

	  if (!cache[res]) {
	    cache[res] = Object.create(null);
	    cache[res][code] = Object.create(null);
	  } else if (!cache[res][code]) {
	    cache[res][code] = Object.create(null);
	  } else if (cache[res][code][src]) {
	    return cache[res][code][src];
	  }

	  var syntax = res.substr(res.lastIndexOf('.') + 1);
	  var parser = parsers[syntax];

	  var saveEntries = function saveEntries(data) {
	    var ast = parser ? parser(_this, data) : data;
	    cache[res][code][src] = createEntries(lang, ast);
	  };

	  var recover = function recover(err) {
	    _this.emit('fetcherror', err);
	    cache[res][code][src] = err;
	  };

	  var langToFetch = src === 'qps' ? { code: this.defaultLang, src: 'app' } : lang;

	  return cache[res][code][src] = this.fetch(res, langToFetch).then(saveEntries, recover);
	};

	function createEntries(lang, ast) {
	  var entries = Object.create(null);
	  var create = lang.src === 'qps' ? createPseudoEntry : _resolver.createEntry;

	  for (var i = 0, node; node = ast[i]; i++) {
	    entries[node.$i] = create(node, lang);
	  }

	  return entries;
	}

	function createPseudoEntry(node, lang) {
	  return (0, _resolver.createEntry)((0, _pseudo.walkContent)(node, _pseudo.qps[lang.code].translate), lang);
	}
	module.exports = exports['default'];

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _errors = __webpack_require__(6);

	var MAX_PLACEABLES_L20N = 100;

	exports['default'] = {
	  _patterns: {
	    identifier: /[A-Za-z_]\w*/g,
	    unicode: /\\u([0-9a-fA-F]{1,4})/g,
	    index: /@cldr\.plural\(\$?(\w+)\)/g,
	    placeables: /\{\{\s*\$?([^\s]*?)\s*\}\}/,
	    unesc: /\\({{|u[0-9a-fA-F]{4}|.)/g },

	  parse: function parse(env, string, simple) {
	    this._source = string;
	    this._index = 0;
	    this._length = this._source.length;
	    this.simpleMode = simple;
	    this.env = env;

	    return this.getL20n();
	  },

	  getAttributes: function getAttributes() {
	    var attrs = Object.create(null);
	    var attr, ws1, ch;

	    while (true) {
	      attr = this.getKVPWithIndex();
	      attrs[attr[0]] = attr[1];
	      ws1 = this.getRequiredWS();
	      ch = this._source.charAt(this._index);
	      if (ch === '>') {
	        break;
	      } else if (!ws1) {
	        throw this.error('Expected ">"');
	      }
	    }
	    return attrs;
	  },

	  getKVP: function getKVP() {
	    var key = this.getIdentifier();
	    this.getWS();
	    if (this._source.charAt(this._index) !== ':') {
	      throw this.error('Expected ":"');
	    }
	    ++this._index;
	    this.getWS();
	    return [key, this.getValue()];
	  },

	  getKVPWithIndex: function getKVPWithIndex() {
	    var key = this.getIdentifier();
	    var index = null;

	    if (this._source.charAt(this._index) === '[') {
	      ++this._index;
	      this.getWS();
	      index = this.getIndex();
	    }
	    this.getWS();
	    if (this._source.charAt(this._index) !== ':') {
	      throw this.error('Expected ":"');
	    }
	    ++this._index;
	    this.getWS();
	    return [key, this.getValue(false, undefined, index)];
	  },

	  getHash: function getHash() {
	    ++this._index;
	    this.getWS();
	    var hi,
	        comma,
	        hash = {};
	    while (true) {
	      hi = this.getKVP();
	      hash[hi[0]] = hi[1];
	      this.getWS();

	      comma = this._source.charAt(this._index) === ',';
	      if (comma) {
	        ++this._index;
	        this.getWS();
	      }
	      if (this._source.charAt(this._index) === '}') {
	        ++this._index;
	        break;
	      }
	      if (!comma) {
	        throw this.error('Expected "}"');
	      }
	    }
	    return hash;
	  },

	  unescapeString: function unescapeString(str, opchar) {
	    function replace(match, p1) {
	      switch (p1) {
	        case '\\':
	          return '\\';
	        case '{{':
	          return '{{';
	        case opchar:
	          return opchar;
	        default:
	          if (p1.length === 5 && p1.charAt(0) === 'u') {
	            return String.fromCharCode(parseInt(p1.substr(1), 16));
	          }
	          throw this.error('Illegal unescape sequence');
	      }
	    }
	    return str.replace(this._patterns.unesc, replace.bind(this));
	  },

	  getString: function getString(opchar) {
	    var overlay = false;

	    var opcharPos = this._source.indexOf(opchar, this._index + 1);

	    outer: while (opcharPos !== -1) {
	      var backtrack = opcharPos - 1;
	      // 92 === '\'
	      while (this._source.charCodeAt(backtrack) === 92) {
	        if (this._source.charCodeAt(backtrack - 1) === 92) {
	          backtrack -= 2;
	        } else {
	          opcharPos = this._source.indexOf(opchar, opcharPos + 1);
	          continue outer;
	        }
	      }
	      break;
	    }

	    if (opcharPos === -1) {
	      throw this.error('Unclosed string literal');
	    }

	    var buf = this._source.slice(this._index + 1, opcharPos);

	    this._index = opcharPos + 1;

	    if (!this.simpleMode && buf.indexOf('\\') !== -1) {
	      buf = this.unescapeString(buf, opchar);
	    }

	    if (buf.indexOf('<') > -1 || buf.indexOf('&') > -1) {
	      overlay = true;
	    }

	    if (!this.simpleMode && buf.indexOf('{{') !== -1) {
	      return [this.parseString(buf), overlay];
	    }

	    return [buf, overlay];
	  },

	  getValue: function getValue(optional, ch, index) {
	    var val;

	    if (ch === undefined) {
	      ch = this._source.charAt(this._index);
	    }
	    if (ch === '\'' || ch === '"') {
	      var valAndOverlay = this.getString(ch);
	      if (valAndOverlay[1]) {
	        val = { '$o': valAndOverlay[0] };
	      } else {
	        val = valAndOverlay[0];
	      }
	    } else if (ch === '{') {
	      val = this.getHash();
	    }

	    if (val === undefined) {
	      if (!optional) {
	        throw this.error('Unknown value type');
	      }
	      return null;
	    }

	    if (index) {
	      return { '$v': val, '$x': index };
	    }

	    return val;
	  },

	  getRequiredWS: function getRequiredWS() {
	    var pos = this._index;
	    var cc = this._source.charCodeAt(pos);
	    // space, \n, \t, \r
	    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
	      cc = this._source.charCodeAt(++this._index);
	    }
	    return this._index !== pos;
	  },

	  getWS: function getWS() {
	    var cc = this._source.charCodeAt(this._index);
	    // space, \n, \t, \r
	    while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
	      cc = this._source.charCodeAt(++this._index);
	    }
	  },

	  getIdentifier: function getIdentifier() {
	    var reId = this._patterns.identifier;
	    reId.lastIndex = this._index;
	    var match = reId.exec(this._source);
	    if (reId.lastIndex !== this._index + match[0].length) {
	      throw this.error('Identifier has to start with [a-zA-Z_]');
	    }
	    this._index = reId.lastIndex;

	    return match[0];
	  },

	  getComment: function getComment() {
	    this._index += 2;
	    var start = this._index;
	    var end = this._source.indexOf('*/', start);

	    if (end === -1) {
	      throw this.error('Comment without closing tag');
	    }
	    this._index = end + 2;
	    return;
	  },

	  getEntity: function getEntity(id, index) {
	    var entity = { '$i': id };

	    if (index) {
	      entity.$x = index;
	    }

	    if (!this.getRequiredWS()) {
	      throw this.error('Expected white space');
	    }

	    var ch = this._source.charAt(this._index);
	    var value = this.getValue(index === null, ch);
	    var attrs = null;
	    if (value === null) {
	      if (ch === '>') {
	        throw this.error('Expected ">"');
	      }
	      attrs = this.getAttributes();
	    } else {
	      entity.$v = value;
	      var ws1 = this.getRequiredWS();
	      if (this._source.charAt(this._index) !== '>') {
	        if (!ws1) {
	          throw this.error('Expected ">"');
	        }
	        attrs = this.getAttributes();
	      }
	    }

	    // skip '>'
	    ++this._index;

	    if (attrs) {
	      /* jshint -W089 */
	      for (var key in attrs) {
	        entity[key] = attrs[key];
	      }
	    }

	    return entity;
	  },

	  getEntry: function getEntry() {
	    // 60 === '<'
	    if (this._source.charCodeAt(this._index) === 60) {
	      ++this._index;
	      var id = this.getIdentifier();
	      // 91 == '['
	      if (this._source.charCodeAt(this._index) === 91) {
	        ++this._index;
	        return this.getEntity(id, this.getIndex());
	      }
	      return this.getEntity(id, null);
	    }
	    if (this._source.charCodeAt(this._index) === 47 && this._source.charCodeAt(this._index + 1) === 42) {
	      return this.getComment();
	    }
	    throw this.error('Invalid entry');
	  },

	  getL20n: function getL20n() {
	    var ast = [];

	    this.getWS();
	    while (this._index < this._length) {
	      try {
	        var entry = this.getEntry();
	        if (entry) {
	          ast.push(entry);
	        }
	      } catch (e) {
	        if (this.env) {
	          this.env.emit('parseerror', e);
	        } else {
	          throw e;
	        }
	      }

	      if (this._index < this._length) {
	        this.getWS();
	      }
	    }

	    return ast;
	  },

	  getIndex: function getIndex() {
	    this.getWS();
	    this._patterns.index.lastIndex = this._index;
	    var match = this._patterns.index.exec(this._source);
	    this._index = this._patterns.index.lastIndex;
	    this.getWS();
	    this._index++;

	    return [{ t: 'idOrVar', v: 'plural' }, match[1]];
	  },

	  parseString: function parseString(str) {
	    var chunks = str.split(this._patterns.placeables);
	    var complexStr = [];

	    var len = chunks.length;
	    var placeablesCount = (len - 1) / 2;

	    if (placeablesCount >= MAX_PLACEABLES_L20N) {
	      throw new _errors.L10nError('Too many placeables (' + placeablesCount + ', max allowed is ' + MAX_PLACEABLES_L20N + ')');
	    }

	    for (var i = 0; i < chunks.length; i++) {
	      if (chunks[i].length === 0) {
	        continue;
	      }
	      if (i % 2 === 1) {
	        complexStr.push({ t: 'idOrVar', v: chunks[i] });
	      } else {
	        complexStr.push(chunks[i]);
	      }
	    }
	    return complexStr;
	  },

	  error: function error(message, pos) {
	    if (pos === undefined) {
	      pos = this._index;
	    }
	    var start = this._source.lastIndexOf('<', pos - 1);
	    var lastClose = this._source.lastIndexOf('>', pos - 1);
	    start = lastClose > start ? lastClose + 1 : start;
	    var context = this._source.slice(start, pos + 10);

	    var msg = message + ' at pos ' + pos + ': "' + context + '"';
	    return new _errors.L10nError(msg, pos, context);
	  }
	};
	module.exports = exports['default'];

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports['default'] = Context;

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

	var _errors = __webpack_require__(6);

	var _resolver = __webpack_require__(10);

	var _plurals = __webpack_require__(11);

	var _plurals2 = _interopRequireDefault(_plurals);

	function Context(env, resIds) {
	  this._env = env;
	  this._resIds = resIds;
	}

	Context.prototype.fetch = function (langs) {
	  // XXX add arg: count of langs to fetch
	  return Promise.resolve(langs).then(this._fetchResources.bind(this));
	};

	Context.prototype._formatTuple = function (args, entity) {
	  try {
	    return (0, _resolver.format)(this, args, entity);
	  } catch (err) {
	    this._env.emit('resolveerror', err, this);
	    return [{ error: err }, entity.id];
	  }
	};

	Context.prototype._formatValue = function (args, entity) {
	  if (typeof entity === 'string') {
	    return entity;
	  }

	  // take the string value only
	  return this._formatTuple.call(this, args, entity)[1];
	};

	Context.prototype.formatValue = function (langs, id, args) {
	  return this.fetch(langs).then(this._fallback.bind(this, Context.prototype._formatValue, id, args));
	};

	Context.prototype._formatEntity = function (args, entity) {
	  var _formatTuple$call = this._formatTuple.call(this, args, entity);

	  var _formatTuple$call2 = _slicedToArray(_formatTuple$call, 2);

	  var locals = _formatTuple$call2[0];
	  var value = _formatTuple$call2[1];

	  var formatted = {
	    value: value,
	    attrs: null,
	    overlay: locals.overlay
	  };

	  if (entity.attrs) {
	    formatted.attrs = Object.create(null);
	  }

	  for (var key in entity.attrs) {
	    /* jshint -W089 */

	    var _formatTuple$call3 = this._formatTuple.call(this, args, entity.attrs[key]);

	    var _formatTuple$call32 = _slicedToArray(_formatTuple$call3, 2);

	    var attrLocals = _formatTuple$call32[0];
	    var attrValue = _formatTuple$call32[1];

	    formatted.attrs[key] = attrValue;
	    if (attrLocals.overlay) {
	      formatted.overlay = true;
	    }
	  }

	  return formatted;
	};

	Context.prototype.formatEntity = function (langs, id, args) {
	  return this.fetch(langs).then(this._fallback.bind(this, Context.prototype._formatEntity, id, args));
	};

	Context.prototype.destroy = function () {
	  this._env.destroyContext(this);
	};

	Context.prototype._fetchResources = function (langs) {
	  if (langs.length === 0) {
	    return Promise.resolve(langs);
	  }

	  return Promise.all(this._resIds.map(this._env._getResource.bind(this._env, langs[0]))).then(function () {
	    return langs;
	  });
	};

	Context.prototype._fallback = function (method, id, args, langs) {
	  var lang = langs[0];

	  if (!lang) {
	    var err = new _errors.L10nError('"' + id + '"' + ' not found in any language.', id);
	    this._env.emit('notfounderror', err, this);
	    return id;
	  }

	  var entity = this._getEntity(lang, id);

	  if (entity) {
	    return method.call(this, args, entity);
	  } else {
	    var err = new _errors.L10nError('"' + id + '"' + ' not found in ' + lang.code + '.', id, lang.code);
	    this._env.emit('notfounderror', err, this);
	  }

	  return this._fetchResources(langs.slice(1)).then(this._fallback.bind(this, method, id, args));
	};

	Context.prototype._getEntity = function (lang, id) {
	  var cache = this._env._resCache;

	  // Look for `id` in every resource in order.
	  for (var i = 0, resId; resId = this._resIds[i]; i++) {
	    var resource = cache[resId][lang.code][lang.src];
	    if (resource instanceof _errors.L10nError) {
	      continue;
	    }
	    if (id in resource) {
	      return resource[id];
	    }
	  }
	  return undefined;
	};

	// XXX in the future macros will be stored in localization resources together
	// with regular entities and this method will not be needed anymore
	Context.prototype._getMacro = function (lang, id) {
	  switch (id) {
	    case 'plural':
	      return (0, _plurals2['default'])(lang.code);
	    default:
	      return undefined;
	  }
	};
	module.exports = exports['default'];

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.createEntry = createEntry;
	exports.format = format;

	var _errors = __webpack_require__(6);

	var KNOWN_MACROS = ['plural'];
	var MAX_PLACEABLE_LENGTH = 2500;

	// Matches characters outside of the Latin-1 character set
	var nonLatin1 = /[^\x01-\xFF]/;

	// Unicode bidi isolation characters
	var FSI = 'â¨';
	var PDI = 'â©';

	function createEntry(node, lang) {
	  var keys = Object.keys(node);

	  // the most common scenario: a simple string with no arguments
	  if (typeof node.$v === 'string' && keys.length === 2) {
	    return node.$v;
	  }

	  var attrs;

	  for (var i = 0, key; key = keys[i]; i++) {
	    // skip $i (id), $v (value), $x (index)
	    if (key[0] === '$') {
	      continue;
	    }

	    if (!attrs) {
	      attrs = Object.create(null);
	    }
	    attrs[key] = createAttribute(node[key], lang, node.$i + '.' + key);
	  }

	  return {
	    id: node.$i,
	    value: node.$v !== undefined ? node.$v : null,
	    index: node.$x || null,
	    attrs: attrs || null,
	    lang: lang,
	    // the dirty guard prevents cyclic or recursive references
	    dirty: false
	  };
	}

	function createAttribute(node, lang, id) {
	  if (typeof node === 'string') {
	    return node;
	  }

	  return {
	    id: id,
	    value: node.$v || (node !== undefined ? node : null),
	    index: node.$x || null,
	    lang: lang,
	    dirty: false
	  };
	}

	function format(ctx, args, entity) {
	  var locals = {
	    overlay: false
	  };

	  if (typeof entity === 'string') {
	    return [locals, entity];
	  }

	  if (entity.dirty) {
	    throw new _errors.L10nError('Cyclic reference detected: ' + entity.id);
	  }

	  entity.dirty = true;

	  var rv;

	  // if format fails, we want the exception to bubble up and stop the whole
	  // resolving process;  however, we still need to clean up the dirty flag
	  try {
	    rv = resolveValue(locals, ctx, entity.lang, args, entity.value, entity.index);
	  } finally {
	    entity.dirty = false;
	  }
	  return rv;
	}

	function resolveIdentifier(ctx, lang, args, id) {
	  if (KNOWN_MACROS.indexOf(id) > -1) {
	    return [{}, ctx._getMacro(lang, id)];
	  }

	  if (args && args.hasOwnProperty(id)) {
	    if (typeof args[id] === 'string' || typeof args[id] === 'number' && !isNaN(args[id])) {
	      return [{}, args[id]];
	    } else {
	      throw new _errors.L10nError('Arg must be a string or a number: ' + id);
	    }
	  }

	  // XXX: special case for Node.js where still:
	  // '__proto__' in Object.create(null) => true
	  if (id === '__proto__') {
	    throw new _errors.L10nError('Illegal id: ' + id);
	  }

	  var entity = ctx._getEntity(lang, id);

	  if (entity) {
	    return format(ctx, args, entity);
	  }

	  throw new _errors.L10nError('Unknown reference: ' + id);
	}

	function subPlaceable(locals, ctx, lang, args, id) {
	  var res;

	  try {
	    res = resolveIdentifier(ctx, lang, args, id);
	  } catch (err) {
	    return [{ error: err }, '{{ ' + id + ' }}'];
	  }

	  var value = res[1];

	  if (typeof value === 'number') {
	    return res;
	  }

	  if (typeof value === 'string') {
	    // prevent Billion Laughs attacks
	    if (value.length >= MAX_PLACEABLE_LENGTH) {
	      throw new _errors.L10nError('Too many characters in placeable (' + value.length + ', max allowed is ' + MAX_PLACEABLE_LENGTH + ')');
	    }

	    if (locals.contextIsNonLatin1 || value.match(nonLatin1)) {
	      // When dealing with non-Latin-1 text
	      // we wrap substitutions in bidi isolate characters
	      // to avoid bidi issues.
	      res[1] = FSI + value + PDI;
	    }

	    return res;
	  }

	  return [{}, '{{ ' + id + ' }}'];
	}

	function interpolate(locals, ctx, lang, args, arr) {
	  return arr.reduce(function (prev, cur) {
	    if (typeof cur === 'string') {
	      return [prev[0], prev[1] + cur];
	    } else if (cur.t === 'idOrVar') {
	      var placeable = subPlaceable(locals, ctx, lang, args, cur.v);
	      if (placeable[0].overlay) {
	        prev[0].overlay = true;
	      }
	      return [prev[0], prev[1] + placeable[1]];
	    }
	  }, [locals, '']);
	}

	function resolveSelector(ctx, lang, args, expr, index) {
	  var selectorName = index[0].v;
	  var selector = resolveIdentifier(ctx, lang, args, selectorName)[1];

	  if (typeof selector !== 'function') {
	    // selector is a simple reference to an entity or args
	    return selector;
	  }

	  var argValue = index[1] ? resolveIdentifier(ctx, lang, args, index[1])[1] : undefined;

	  if (selectorName === 'plural') {
	    // special cases for zero, one, two if they are defined on the hash
	    if (argValue === 0 && 'zero' in expr) {
	      return 'zero';
	    }
	    if (argValue === 1 && 'one' in expr) {
	      return 'one';
	    }
	    if (argValue === 2 && 'two' in expr) {
	      return 'two';
	    }
	  }

	  return selector(argValue);
	}

	function resolveValue(_x, _x2, _x3, _x4, _x5, _x6) {
	  var _again = true;

	  _function: while (_again) {
	    var locals = _x,
	        ctx = _x2,
	        lang = _x3,
	        args = _x4,
	        expr = _x5,
	        index = _x6;
	    selector = undefined;
	    _again = false;

	    if (!expr) {
	      return [locals, expr];
	    }

	    if (expr.$o) {
	      expr = expr.$o;
	      locals.overlay = true;
	    }

	    if (typeof expr === 'string' || typeof expr === 'boolean' || typeof expr === 'number') {
	      return [locals, expr];
	    }

	    if (Array.isArray(expr)) {
	      locals.contextIsNonLatin1 = expr.some(function ($_) {
	        return typeof $_ === 'string' && $_.match(nonLatin1);
	      });
	      return interpolate(locals, ctx, lang, args, expr);
	    }

	    // otherwise, it's a dict
	    if (index) {
	      // try to use the index in order to select the right dict member
	      var selector = resolveSelector(ctx, lang, args, expr, index);
	      if (expr.hasOwnProperty(selector)) {
	        _x = locals;
	        _x2 = ctx;
	        _x3 = lang;
	        _x4 = args;
	        _x5 = expr[selector];
	        _again = true;
	        continue _function;
	      }
	    }

	    // if there was no index or no selector was found, try 'other'
	    if ('other' in expr) {
	      _x = locals;
	      _x2 = ctx;
	      _x3 = lang;
	      _x4 = args;
	      _x5 = expr.other;
	      _again = true;
	      continue _function;
	    }

	    // XXX Specify entity id
	    throw new _errors.L10nError('Unresolvable value');
	  }
	}

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports['default'] = getPluralRule;

	function getPluralRule(code) {
	  var locales2rules = {
	    'af': 3,
	    'ak': 4,
	    'am': 4,
	    'ar': 1,
	    'asa': 3,
	    'az': 0,
	    'be': 11,
	    'bem': 3,
	    'bez': 3,
	    'bg': 3,
	    'bh': 4,
	    'bm': 0,
	    'bn': 3,
	    'bo': 0,
	    'br': 20,
	    'brx': 3,
	    'bs': 11,
	    'ca': 3,
	    'cgg': 3,
	    'chr': 3,
	    'cs': 12,
	    'cy': 17,
	    'da': 3,
	    'de': 3,
	    'dv': 3,
	    'dz': 0,
	    'ee': 3,
	    'el': 3,
	    'en': 3,
	    'eo': 3,
	    'es': 3,
	    'et': 3,
	    'eu': 3,
	    'fa': 0,
	    'ff': 5,
	    'fi': 3,
	    'fil': 4,
	    'fo': 3,
	    'fr': 5,
	    'fur': 3,
	    'fy': 3,
	    'ga': 8,
	    'gd': 24,
	    'gl': 3,
	    'gsw': 3,
	    'gu': 3,
	    'guw': 4,
	    'gv': 23,
	    'ha': 3,
	    'haw': 3,
	    'he': 2,
	    'hi': 4,
	    'hr': 11,
	    'hu': 0,
	    'id': 0,
	    'ig': 0,
	    'ii': 0,
	    'is': 3,
	    'it': 3,
	    'iu': 7,
	    'ja': 0,
	    'jmc': 3,
	    'jv': 0,
	    'ka': 0,
	    'kab': 5,
	    'kaj': 3,
	    'kcg': 3,
	    'kde': 0,
	    'kea': 0,
	    'kk': 3,
	    'kl': 3,
	    'km': 0,
	    'kn': 0,
	    'ko': 0,
	    'ksb': 3,
	    'ksh': 21,
	    'ku': 3,
	    'kw': 7,
	    'lag': 18,
	    'lb': 3,
	    'lg': 3,
	    'ln': 4,
	    'lo': 0,
	    'lt': 10,
	    'lv': 6,
	    'mas': 3,
	    'mg': 4,
	    'mk': 16,
	    'ml': 3,
	    'mn': 3,
	    'mo': 9,
	    'mr': 3,
	    'ms': 0,
	    'mt': 15,
	    'my': 0,
	    'nah': 3,
	    'naq': 7,
	    'nb': 3,
	    'nd': 3,
	    'ne': 3,
	    'nl': 3,
	    'nn': 3,
	    'no': 3,
	    'nr': 3,
	    'nso': 4,
	    'ny': 3,
	    'nyn': 3,
	    'om': 3,
	    'or': 3,
	    'pa': 3,
	    'pap': 3,
	    'pl': 13,
	    'ps': 3,
	    'pt': 3,
	    'rm': 3,
	    'ro': 9,
	    'rof': 3,
	    'ru': 11,
	    'rwk': 3,
	    'sah': 0,
	    'saq': 3,
	    'se': 7,
	    'seh': 3,
	    'ses': 0,
	    'sg': 0,
	    'sh': 11,
	    'shi': 19,
	    'sk': 12,
	    'sl': 14,
	    'sma': 7,
	    'smi': 7,
	    'smj': 7,
	    'smn': 7,
	    'sms': 7,
	    'sn': 3,
	    'so': 3,
	    'sq': 3,
	    'sr': 11,
	    'ss': 3,
	    'ssy': 3,
	    'st': 3,
	    'sv': 3,
	    'sw': 3,
	    'syr': 3,
	    'ta': 3,
	    'te': 3,
	    'teo': 3,
	    'th': 0,
	    'ti': 4,
	    'tig': 3,
	    'tk': 3,
	    'tl': 4,
	    'tn': 3,
	    'to': 0,
	    'tr': 0,
	    'ts': 3,
	    'tzm': 22,
	    'uk': 11,
	    'ur': 3,
	    've': 3,
	    'vi': 0,
	    'vun': 3,
	    'wa': 4,
	    'wae': 3,
	    'wo': 0,
	    'xh': 3,
	    'xog': 3,
	    'yo': 0,
	    'zh': 0,
	    'zu': 3
	  };

	  // utility functions for plural rules methods
	  function isIn(n, list) {
	    return list.indexOf(n) !== -1;
	  }
	  function isBetween(n, start, end) {
	    return typeof n === typeof start && start <= n && n <= end;
	  }

	  // list of all plural rules methods:
	  // map an integer to the plural form name to use
	  var pluralRules = {
	    '0': function _() {
	      return 'other';
	    },
	    '1': function _(n) {
	      if (isBetween(n % 100, 3, 10)) {
	        return 'few';
	      }
	      if (n === 0) {
	        return 'zero';
	      }
	      if (isBetween(n % 100, 11, 99)) {
	        return 'many';
	      }
	      if (n === 2) {
	        return 'two';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '2': function _(n) {
	      if (n !== 0 && n % 10 === 0) {
	        return 'many';
	      }
	      if (n === 2) {
	        return 'two';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '3': function _(n) {
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '4': function _(n) {
	      if (isBetween(n, 0, 1)) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '5': function _(n) {
	      if (isBetween(n, 0, 2) && n !== 2) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '6': function _(n) {
	      if (n === 0) {
	        return 'zero';
	      }
	      if (n % 10 === 1 && n % 100 !== 11) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '7': function _(n) {
	      if (n === 2) {
	        return 'two';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '8': function _(n) {
	      if (isBetween(n, 3, 6)) {
	        return 'few';
	      }
	      if (isBetween(n, 7, 10)) {
	        return 'many';
	      }
	      if (n === 2) {
	        return 'two';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '9': function _(n) {
	      if (n === 0 || n !== 1 && isBetween(n % 100, 1, 19)) {
	        return 'few';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '10': function _(n) {
	      if (isBetween(n % 10, 2, 9) && !isBetween(n % 100, 11, 19)) {
	        return 'few';
	      }
	      if (n % 10 === 1 && !isBetween(n % 100, 11, 19)) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '11': function _(n) {
	      if (isBetween(n % 10, 2, 4) && !isBetween(n % 100, 12, 14)) {
	        return 'few';
	      }
	      if (n % 10 === 0 || isBetween(n % 10, 5, 9) || isBetween(n % 100, 11, 14)) {
	        return 'many';
	      }
	      if (n % 10 === 1 && n % 100 !== 11) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '12': function _(n) {
	      if (isBetween(n, 2, 4)) {
	        return 'few';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '13': function _(n) {
	      if (isBetween(n % 10, 2, 4) && !isBetween(n % 100, 12, 14)) {
	        return 'few';
	      }
	      if (n !== 1 && isBetween(n % 10, 0, 1) || isBetween(n % 10, 5, 9) || isBetween(n % 100, 12, 14)) {
	        return 'many';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '14': function _(n) {
	      if (isBetween(n % 100, 3, 4)) {
	        return 'few';
	      }
	      if (n % 100 === 2) {
	        return 'two';
	      }
	      if (n % 100 === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '15': function _(n) {
	      if (n === 0 || isBetween(n % 100, 2, 10)) {
	        return 'few';
	      }
	      if (isBetween(n % 100, 11, 19)) {
	        return 'many';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '16': function _(n) {
	      if (n % 10 === 1 && n !== 11) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '17': function _(n) {
	      if (n === 3) {
	        return 'few';
	      }
	      if (n === 0) {
	        return 'zero';
	      }
	      if (n === 6) {
	        return 'many';
	      }
	      if (n === 2) {
	        return 'two';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '18': function _(n) {
	      if (n === 0) {
	        return 'zero';
	      }
	      if (isBetween(n, 0, 2) && n !== 0 && n !== 2) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '19': function _(n) {
	      if (isBetween(n, 2, 10)) {
	        return 'few';
	      }
	      if (isBetween(n, 0, 1)) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '20': function _(n) {
	      if ((isBetween(n % 10, 3, 4) || n % 10 === 9) && !(isBetween(n % 100, 10, 19) || isBetween(n % 100, 70, 79) || isBetween(n % 100, 90, 99))) {
	        return 'few';
	      }
	      if (n % 1000000 === 0 && n !== 0) {
	        return 'many';
	      }
	      if (n % 10 === 2 && !isIn(n % 100, [12, 72, 92])) {
	        return 'two';
	      }
	      if (n % 10 === 1 && !isIn(n % 100, [11, 71, 91])) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '21': function _(n) {
	      if (n === 0) {
	        return 'zero';
	      }
	      if (n === 1) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '22': function _(n) {
	      if (isBetween(n, 0, 1) || isBetween(n, 11, 99)) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '23': function _(n) {
	      if (isBetween(n % 10, 1, 2) || n % 20 === 0) {
	        return 'one';
	      }
	      return 'other';
	    },
	    '24': function _(n) {
	      if (isBetween(n, 3, 10) || isBetween(n, 13, 19)) {
	        return 'few';
	      }
	      if (isIn(n, [2, 12])) {
	        return 'two';
	      }
	      if (isIn(n, [1, 11])) {
	        return 'one';
	      }
	      return 'other';
	    }
	  };

	  // return a function that gives the plural form name for a given integer
	  var index = locales2rules[code.replace(/-.*$/, '')];
	  if (!(index in pluralRules)) {
	    return function () {
	      return 'other';
	    };
	  }
	  return pluralRules[index];
	}

	module.exports = exports['default'];

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _errors = __webpack_require__(6);

	var MAX_PLACEABLES = 100;

	exports['default'] = {
	  patterns: null,
	  entryIds: null,

	  init: function init() {
	    this.patterns = {
	      comment: /^\s*#|^\s*$/,
	      entity: /^([^=\s]+)\s*=\s*(.*)$/,
	      multiline: /[^\\]\\$/,
	      index: /\{\[\s*(\w+)(?:\(([^\)]*)\))?\s*\]\}/i,
	      unicode: /\\u([0-9a-fA-F]{1,4})/g,
	      entries: /[^\r\n]+/g,
	      controlChars: /\\([\\\n\r\t\b\f\{\}\"\'])/g,
	      placeables: /\{\{\s*([^\s]*?)\s*\}\}/ };
	  },

	  parse: function parse(env, source) {
	    if (!this.patterns) {
	      this.init();
	    }

	    var ast = [];
	    this.entryIds = Object.create(null);

	    var entries = source.match(this.patterns.entries);
	    if (!entries) {
	      return ast;
	    }
	    for (var i = 0; i < entries.length; i++) {
	      var line = entries[i];

	      if (this.patterns.comment.test(line)) {
	        continue;
	      }

	      while (this.patterns.multiline.test(line) && i < entries.length) {
	        line = line.slice(0, -1) + entries[++i].trim();
	      }

	      var entityMatch = line.match(this.patterns.entity);
	      if (entityMatch) {
	        try {
	          this.parseEntity(entityMatch[1], entityMatch[2], ast);
	        } catch (e) {
	          if (env) {
	            env.emit('parseerror', e);
	          } else {
	            throw e;
	          }
	        }
	      }
	    }
	    return ast;
	  },

	  parseEntity: function parseEntity(id, value, ast) {
	    var name, key;

	    var pos = id.indexOf('[');
	    if (pos !== -1) {
	      name = id.substr(0, pos);
	      key = id.substring(pos + 1, id.length - 1);
	    } else {
	      name = id;
	      key = null;
	    }

	    var nameElements = name.split('.');

	    if (nameElements.length > 2) {
	      throw new _errors.L10nError('Error in ID: "' + name + '".' + ' Nested attributes are not supported.');
	    }

	    var attr;
	    if (nameElements.length > 1) {
	      name = nameElements[0];
	      attr = nameElements[1];

	      if (attr[0] === '$') {
	        throw new _errors.L10nError('Attribute can\'t start with "$"', id);
	      }
	    } else {
	      attr = null;
	    }

	    this.setEntityValue(name, attr, key, this.unescapeString(value), ast);
	  },

	  setEntityValue: function setEntityValue(id, attr, key, rawValue, ast) {
	    var pos, v;

	    var value = rawValue.indexOf('{{') > -1 ? this.parseString(rawValue) : rawValue;

	    if (rawValue.indexOf('<') > -1 || rawValue.indexOf('&') > -1) {
	      value = { $o: value };
	    }

	    if (attr) {
	      pos = this.entryIds[id];
	      if (pos === undefined) {
	        v = { $i: id };
	        if (key) {
	          v[attr] = {};
	          v[attr][key] = value;
	        } else {
	          v[attr] = value;
	        }
	        ast.push(v);
	        this.entryIds[id] = ast.length - 1;
	        return;
	      }
	      if (key) {
	        if (typeof ast[pos][attr] === 'string') {
	          ast[pos][attr] = {
	            $x: this.parseIndex(ast[pos][attr]),
	            $v: {}
	          };
	        }
	        ast[pos][attr].$v[key] = value;
	        return;
	      }
	      ast[pos][attr] = value;
	      return;
	    }

	    // Hash value
	    if (key) {
	      pos = this.entryIds[id];
	      if (pos === undefined) {
	        v = {};
	        v[key] = value;
	        ast.push({ $i: id, $v: v });
	        this.entryIds[id] = ast.length - 1;
	        return;
	      }
	      if (typeof ast[pos].$v === 'string') {
	        ast[pos].$x = this.parseIndex(ast[pos].$v);
	        ast[pos].$v = {};
	      }
	      ast[pos].$v[key] = value;
	      return;
	    }

	    // simple value
	    ast.push({ $i: id, $v: value });
	    this.entryIds[id] = ast.length - 1;
	  },

	  parseString: function parseString(str) {
	    var chunks = str.split(this.patterns.placeables);
	    var complexStr = [];

	    var len = chunks.length;
	    var placeablesCount = (len - 1) / 2;

	    if (placeablesCount >= MAX_PLACEABLES) {
	      throw new _errors.L10nError('Too many placeables (' + placeablesCount + ', max allowed is ' + MAX_PLACEABLES + ')');
	    }

	    for (var i = 0; i < chunks.length; i++) {
	      if (chunks[i].length === 0) {
	        continue;
	      }
	      if (i % 2 === 1) {
	        complexStr.push({ t: 'idOrVar', v: chunks[i] });
	      } else {
	        complexStr.push(chunks[i]);
	      }
	    }
	    return complexStr;
	  },

	  unescapeString: function unescapeString(str) {
	    if (str.lastIndexOf('\\') !== -1) {
	      str = str.replace(this.patterns.controlChars, '$1');
	    }
	    return str.replace(this.patterns.unicode, function (match, token) {
	      return String.fromCodePoint(parseInt(token, 16));
	    });
	  },

	  parseIndex: function parseIndex(str) {
	    var match = str.match(this.patterns.index);
	    if (!match) {
	      throw new _errors.L10nError('Malformed index');
	    }
	    if (match[2]) {
	      return [{ t: 'idOrVar', v: match[1] }, match[2]];
	    } else {
	      return [{ t: 'idOrVar', v: match[1] }];
	    }
	  }
	};
	module.exports = exports['default'];

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.walkContent = walkContent;
	// Recursively walk an AST node searching for content leaves

	function walkContent(node, fn) {
	  if (typeof node === 'string') {
	    return fn(node);
	  }

	  if (node.t === 'idOrVar') {
	    return node;
	  }

	  var rv = Array.isArray(node) ? [] : {};
	  var keys = Object.keys(node);

	  for (var i = 0, key; key = keys[i]; i++) {
	    // don't change identifier ($i) nor indices ($x)
	    if (key === '$i' || key === '$x') {
	      rv[key] = node[key];
	    } else {
	      rv[key] = walkContent(node[key], fn);
	    }
	  }
	  return rv;
	}

	/* Pseudolocalizations
	 *
	 * PSEUDO is a dict of strategies to be used to modify the English
	 * context in order to create pseudolocalizations.  These can be used by
	 * developers to test the localizability of their code without having to
	 * actually speak a foreign language.
	 *
	 * Currently, the following pseudolocales are supported:
	 *
	 *   qps-ploc - È¦È§ÆˆÆˆá¸—á¸—ÆžÅ§á¸—á¸—á¸“ á¸–á¸—ÆžÉ Å€Ä«Ä«ÅŸÄ§
	 *
	 *     In Accented English all English letters are replaced by accented
	 *     Unicode counterparts which don't impair the readability of the content.
	 *     This allows developers to quickly test if any given string is being
	 *     correctly displayed in its 'translated' form.  Additionally, simple
	 *     heuristics are used to make certain words longer to better simulate the
	 *     experience of international users.
	 *
	 *   qps-plocm - É¥sÄ±Ê…ÆƒuÆŽ pÇÉ¹oÉ¹É¹Ä±W
	 *
	 *     Mirrored English is a fake RTL locale.  All words are surrounded by
	 *     Unicode formatting marks forcing the RTL directionality of characters.
	 *     In addition, to make the reversed text easier to read, individual
	 *     letters are flipped.
	 *
	 *     Note: The name above is hardcoded to be RTL in case code editors have
	 *     trouble with the RLO and PDF Unicode marks.  In reality, it should be
	 *     surrounded by those marks as well.
	 *
	 * See https://bugzil.la/900182 for more information.
	 *
	 */

	var reAlphas = /[a-zA-Z]/g;
	var reVowels = /[aeiouAEIOU]/g;

	// È¦ÆÆ‡á¸’á¸–Æ‘Æ“Ä¦ÄªÄ´Ä¶Ä¿á¸¾È Ç¾Æ¤ÉŠÅ˜ÅžÅ¦Å¬á¹¼áº†áºŠáºŽáº + [\\]^_` + È§Æ€Æˆá¸“á¸—Æ’É Ä§Ä«ÄµÄ·Å€á¸¿ÆžÇ¿Æ¥É‹Å™ÅŸÅ§Å­á¹½áº‡áº‹áºáº‘
	var ACCENTED_MAP = 'È¦ÆÆ‡á¸’á¸–Æ‘Æ“Ä¦Äª' + 'Ä´Ä¶Ä¿á¸¾È Ç¾Æ¤ÉŠÅ˜' + 'ÅžÅ¦Å¬á¹¼áº†áºŠáºŽáº' + '[\\]^_`' + 'È§Æ€Æˆá¸“á¸—Æ’É Ä§Ä«' + 'ÄµÄ·Å€á¸¿ÆžÇ¿Æ¥É‹Å™' + 'ÅŸÅ§Å­á¹½áº‡áº‹áºáº‘';

	// XXX Until https://bugzil.la/1007340 is fixed, á—¡â„²â…â…‚â…„ don't render correctly
	// on the devices.  For now, use the following replacements: pÉŸ×¤Ë¥ÊŽ
	// âˆ€Ôâ†ƒpÆŽÉŸ×¤HIÅ¿Ó¼Ë¥WNOÔ€Ã’á´šSâŠ¥âˆ©É…ï¼­XÊŽZ + [\\]áµ¥_, + ÉqÉ”pÇÉŸÆƒÉ¥Ä±É¾ÊžÊ…É¯uodbÉ¹sÊ‡nÊŒÊxÊŽz
	var FLIPPED_MAP = 'âˆ€Ôâ†ƒpÆŽÉŸ×¤HIÅ¿' + 'Ó¼Ë¥WNOÔ€Ã’á´šSâŠ¥âˆ©É…' + 'ï¼­XÊŽZ' + '[\\]áµ¥_,' + 'ÉqÉ”pÇÉŸÆƒÉ¥Ä±É¾' + 'ÊžÊ…É¯uodbÉ¹sÊ‡nÊŒÊxÊŽz';

	function makeLonger(val) {
	  return val.replace(reVowels, function (match) {
	    return match + match.toLowerCase();
	  });
	}

	function replaceChars(map, val) {
	  // Replace each Latin letter with a Unicode character from map
	  return val.replace(reAlphas, function (match) {
	    return map.charAt(match.charCodeAt(0) - 65);
	  });
	}

	var reWords = /[^\W0-9_]+/g;

	function makeRTL(val) {
	  // Surround each word with Unicode formatting codes, RLO and PDF:
	  //   U+202E:   RIGHT-TO-LEFT OVERRIDE (RLO)
	  //   U+202C:   POP DIRECTIONAL FORMATTING (PDF)
	  // See http://www.w3.org/International/questions/qa-bidi-controls
	  return val.replace(reWords, function (match) {
	    return 'â€®' + match + 'â€¬';
	  });
	}

	// strftime tokens (%a, %Eb), template {vars}, HTML entities (&#x202a;)
	// and HTML tags.
	var reExcluded = /(%[EO]?\w|\{\s*.+?\s*\}|&[#\w]+;|<\s*.+?\s*>)/;

	function mapContent(fn, val) {
	  if (!val) {
	    return val;
	  }
	  var parts = val.split(reExcluded);
	  var modified = parts.map(function (part) {
	    if (reExcluded.test(part)) {
	      return part;
	    }
	    return fn(part);
	  });
	  return modified.join('');
	}

	function Pseudo(id, name, charMap, modFn) {
	  this.id = id;
	  this.translate = mapContent.bind(null, function (val) {
	    return replaceChars(charMap, modFn(val));
	  });
	  this.name = this.translate(name);
	}

	var qps = {
	  'qps-ploc': new Pseudo('qps-ploc', 'Runtime Accented', ACCENTED_MAP, makeLonger),
	  'qps-plocm': new Pseudo('qps-plocm', 'Runtime Mirrored', FLIPPED_MAP, makeRTL)
	};
	exports.qps = qps;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.emit = emit;
	exports.addEventListener = addEventListener;
	exports.removeEventListener = removeEventListener;

	function emit(listeners) {
	  var _this = this;

	  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	    args[_key - 1] = arguments[_key];
	  }

	  var type = args.shift();

	  if (listeners[type]) {
	    listeners[type].slice().forEach(function (listener) {
	      return listener.apply(_this, args);
	    });
	  }

	  if (listeners['*']) {
	    listeners['*'].slice().forEach(function (listener) {
	      return listener.apply(_this, args);
	    });
	  }
	}

	function addEventListener(listeners, type, listener) {
	  if (!(type in listeners)) {
	    listeners[type] = [];
	  }
	  listeners[type].push(listener);
	}

	function removeEventListener(listeners, type, listener) {
	  var typeListeners = listeners[type];
	  var pos = typeListeners.indexOf(listener);
	  if (pos === -1) {
	    return;
	  }

	  typeListeners.splice(pos, 1);
	}

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.getAdditionalLanguages = getAdditionalLanguages;
	exports.onlanguagechage = onlanguagechage;
	exports.onadditionallanguageschange = onadditionallanguageschange;
	exports.changeLanguage = changeLanguage;

	function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

	var _libIntl = __webpack_require__(16);

	var _service = __webpack_require__(4);

	var _libPseudo = __webpack_require__(13);

	var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];

	function getAdditionalLanguages() {
	  if (navigator.mozApps && navigator.mozApps.getAdditionalLanguages) {
	    return navigator.mozApps.getAdditionalLanguages()['catch'](function () {
	      return [];
	    });
	  }

	  return Promise.resolve([]);
	}

	function onlanguagechage(appVersion, defaultLang, availableLangs, requestedLangs) {
	  var _this = this;

	  return this.languages = Promise.all([getAdditionalLanguages(), this.languages]).then(function (_ref) {
	    var _ref2 = _slicedToArray(_ref, 2);

	    var additionalLangs = _ref2[0];
	    var prevLangs = _ref2[1];
	    return changeLanguage.call(_this, appVersion, defaultLang, availableLangs, additionalLangs, prevLangs, requestedLangs || navigator.languages);
	  });
	}

	function onadditionallanguageschange(appVersion, defaultLang, availableLangs, additionalLangs, requestedLangs) {
	  var _this2 = this;

	  return this.languages = this.languages.then(function (prevLangs) {
	    return changeLanguage.call(_this2, appVersion, defaultLang, availableLangs, additionalLangs, prevLangs, requestedLangs || navigator.languages);
	  });
	}

	function changeLanguage(appVersion, defaultLang, availableLangs, additionalLangs, prevLangs, requestedLangs) {

	  var allAvailableLangs = Object.keys(availableLangs).concat(additionalLangs || []).concat(Object.keys(_libPseudo.qps));
	  var newLangs = (0, _libIntl.prioritizeLocales)(defaultLang, allAvailableLangs, requestedLangs);

	  var langs = newLangs.map(function (code) {
	    return {
	      code: code,
	      src: getLangSource(appVersion, availableLangs, additionalLangs, code),
	      dir: getDirection(code)
	    };
	  });

	  if (!arrEqual(prevLangs, newLangs)) {
	    _service.initViews.call(this, langs);
	  }

	  return langs;
	}

	function getDirection(code) {
	  return rtlList.indexOf(code) >= 0 ? 'rtl' : 'ltr';
	}

	function arrEqual(arr1, arr2) {
	  return arr1.length === arr2.length && arr1.every(function (elem, i) {
	    return elem === arr2[i];
	  });
	}

	function getMatchingLangpack(appVersion, langpacks) {
	  for (var i = 0, langpack; langpack = langpacks[i]; i++) {
	    if (langpack.target === appVersion) {
	      return langpack;
	    }
	  }
	  return null;
	}

	function getLangSource(appVersion, availableLangs, additionalLangs, code) {
	  if (additionalLangs && additionalLangs[code]) {
	    var lp = getMatchingLangpack(appVersion, additionalLangs[code]);
	    if (lp && (!(code in availableLangs) || parseInt(lp.revision) > availableLangs[code])) {
	      return 'extra';
	    }
	  }

	  if (code in _libPseudo.qps && !(code in availableLangs)) {
	    return 'qps';
	  }

	  return 'app';
	}

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.prioritizeLocales = prioritizeLocales;

	function prioritizeLocales(def, availableLangs, requested) {
	  var supportedLocale;
	  // Find the first locale in the requested list that is supported.
	  for (var i = 0; i < requested.length; i++) {
	    var locale = requested[i];
	    if (availableLangs.indexOf(locale) !== -1) {
	      supportedLocale = locale;
	      break;
	    }
	  }
	  if (!supportedLocale || supportedLocale === def) {
	    return [def];
	  }

	  return [supportedLocale, def];
	}

/***/ }
/******/ ])));

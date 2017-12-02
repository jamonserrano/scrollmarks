(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(['module', 'exports'], factory);
	} else if (typeof exports !== "undefined") {
		factory(module, exports);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod, mod.exports);
		global.Scrollmarks = mod.exports;
	}
})(this, function (module, exports) {
	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var scrollMarks = window.Map ? new Map() : createfakeMap();

	var index = 0;

	var queue = [];

	var clock = 0;

	var config = {
		scrollThrottle: 10,

		resizeThrottle: 30,

		idleTimeout: 100
	};

	var scrolled = false;

	var scrollTick = 1;

	var previousScroll = 0;

	var scrollDirection = void 0;

	var resized = false;

	var resizeTick = 1;

	var documentElement = document.documentElement;

	var previousHeight = documentElement.scrollHeight;

	var hasIdleCallback = Boolean(window.requestIdleCallback);

	var listenerProperties = false;

	window.addEventListener("test", null, {
		get passive() {
			listenerProperties = {
				passive: true
			};
		}
	});

	function add(mark) {
		var element = mark.element,
		    callback = mark.callback,
		    offset = mark.offset,
		    direction = mark.direction,
		    once = mark.once,
		    debug = mark.debug;


		if (!(element instanceof HTMLElement)) {
			throw new TypeError(errorMessage(false, 'element', 'an HTML Element', element));
		}

		if (!isFunction(callback)) {
			throw new TypeError(errorMessage(false, 'callback', 'a function', callback));
		}

		if (isUndefined(offset)) {
			mark.computedOffset = 0;
		} else if (isNumber(offset) || isFunction(offset)) {
			mark.computedOffset = offset;
		} else if (isString(offset) && offset.slice(-1) === '%') {
			mark.computedOffset = function () {
				return window.innerHeight * parseInt(offset) / 100;
			};
		} else if (isString(offset) && offset.slice(-2) === 'px') {
			mark.computedOffset = parseInt(offset);
		} else {
			throw new TypeError(errorMessage('Optional', 'offset', 'a number, px, %, or a function', offset));
		}

		if (!isUndefined(direction) && direction !== 'up' && direction !== 'down') {
			throw new TypeError(errorMessage('Optional', 'direction', '\'up\' or \'down\'', direction));
		}

		if (!(isUndefined(once) || isBoolean(once))) {
			throw new TypeError(errorMessage('Optional', 'once', 'boolean', once));
		}

		if (!(isUndefined(debug) || isBoolean(debug))) {
			throw new TypeError(errorMessage('Optional', 'debug', 'boolean', debug));
		}

		var key = index++;
		mark.key = key;
		scrollMarks.set(key, mark);

		calculateTriggerPoint(mark);

		if (clock === 0) {
			start();
		} else if (directionMatches(direction, 'down') && mark.triggerPoint <= window.pageYOffset) {
			trigger(mark);
		}

		return key;
	}

	function remove(key) {
		var success = scrollMarks.delete(key);
		if (!scrollMarks.size) {
			stop();
		}
		return success;
	}

	function start() {
		if (clock === 0 && scrollMarks.size) {
			checkMarks();

			window.addEventListener('scroll', onScroll, listenerProperties);
			window.addEventListener('resize', onResize, listenerProperties);
			clock = window.requestAnimationFrame(checkState);
		}
	}

	function stop() {
		if (clock > 0) {
			window.cancelAnimationFrame(clock);
			window.removeEventListener('scroll', onScroll, listenerProperties);
			window.removeEventListener('resize', onResize, listenerProperties);

			clock = 0;
			previousScroll = 0;
			scrolled = false;
			resized = false;
			resetTicks();
		}
	}

	function onScroll() {
		window.requestAnimationFrame(function () {
			return scrolled = true;
		});
	}

	function onResize() {
		window.requestAnimationFrame(function () {
			return resized = true;
		});
	}

	function checkState() {
		if (resizeTick === config.resizeThrottle) {
			if (resized) {
				idle(updateTriggerPoints);
				resized = false;
			} else {
				var height = documentElement.scrollHeight;
				if (previousHeight !== height) {
					idle(updateTriggerPoints);
					previousHeight = height;
				}
			}
			resizeTick = 1;
		} else {
			resizeTick++;
		}

		if (scrollTick === config.scrollThrottle) {
			if (scrolled) {
				checkMarks();
				scrolled = false;
			}
			scrollTick = 1;
		} else {
			scrollTick++;
		}

		clock = window.requestAnimationFrame(checkState);
	}

	function checkMarks() {
		var currentScroll = window.pageYOffset;
		scrollDirection = previousScroll < currentScroll ? 'down' : 'up';

		scrollMarks.forEach(function (mark) {
			var markDirection = mark.direction;

			if (mark.element.offsetParent !== null && directionMatches(markDirection)) {
				var triggerPoint = mark.triggerPoint;

				if (previousScroll < triggerPoint === triggerPoint <= currentScroll) {
					queue.push(mark);
				}
			}
		});

		triggerQueue();

		previousScroll = currentScroll;
	}

	function triggerQueue() {
		queue.sort(scrollDirection === 'down' ? sortAscending : sortDescending);

		queue.forEach(trigger);

		queue = [];
	}

	function trigger(mark) {
		mark.callback(scrollDirection, mark);

		if (mark.once) {
			remove(mark.key);
		}
	}

	function sortAscending(a, b) {
		return a.triggerPoint - b.triggerPoint;
	}

	function sortDescending(a, b) {
		return b.triggerPoint - a.triggerPoint;
	}

	function directionMatches(markDirection, direction) {
		return !markDirection || markDirection === (direction || scrollDirection);
	}

	function updateTriggerPoints() {
		scrollMarks.forEach(calculateTriggerPoint);
	}

	function calculateTriggerPoint(mark) {
		var computedOffset = mark.computedOffset;
		var offsetValue = isFunction(computedOffset) ? computedOffset(mark.element) : computedOffset;
		mark.triggerPoint = window.pageYOffset + mark.element.getBoundingClientRect().top - offsetValue;
		if (mark.debug) {
			setHelperElement(mark);
		}
	}

	function refresh(key) {
		if (isUndefined(key)) {
			idle(updateTriggerPoints);
		} else if (scrollMarks.has(key)) {
			idle(function () {
				return calculateTriggerPoint(scrollMarks.get(key));
			});
		} else {
			throw new ReferenceError('Could not refresh scrollmark \'' + key + '\', mark doesn\'t exist');
		}
	}

	function idle(callback) {
		var idleTimeout = config.idleTimeout;
		if (idleTimeout === 0) {
			callback();
		} else if (hasIdleCallback) {
			window.requestIdleCallback(callback, { timeout: idleTimeout });
		} else {
			window.setTimeout(callback, 0);
		}
	}

	function setHelperElement(mark) {
		var helperElement = mark.helper;

		if (!helperElement) {
			helperElement = document.createElement('div');
			var properties = {
				borderTop: '1px solid red',
				color: 'red',
				fontFamily: 'sans-serif',
				fontSize: '14px',
				left: '0',
				minHeight: '20px',
				padding: '3px',
				position: 'absolute',
				width: '100%'
			};

			Object.keys(properties).forEach(function (property) {
				return helperElement.style[property] = properties[property];
			});

			mark.helper = helperElement;
			document.body.appendChild(helperElement);
		}

		helperElement.style.top = mark.triggerPoint + 'px';
		helperElement.innerHTML = 'offset: ' + mark.offset + ', computedOffset: ' + (isFunction(mark.computedOffset) ? mark.computedOffset(mark.element) : mark.computedOffset) + ', triggerPoint: ' + mark.triggerPoint + 'px';
	}

	function createfakeMap() {
		return Object.defineProperties({}, {
			'delete': {
				value: function value(key) {
					return this.has(key) && delete this[key];
				}
			},
			'forEach': {
				value: function value(callback) {
					var _this = this;

					Object.keys(this).forEach(function (key) {
						return callback(_this[key], key, _this);
					});
				}
			},
			'get': {
				value: function value(key) {
					return this[key];
				}
			},
			'has': {
				value: function value(key) {
					return this.hasOwnProperty(key);
				}
			},
			'set': {
				value: function value(key, _value) {
					this[key] = _value;
					return this;
				}
			},
			'size': {
				get: function get() {
					return Object.keys(this).length;
				}
			}
		});
	}

	function isNumber(value) {
		return typeof value === 'number';
	}

	function isString(value) {
		return typeof value === 'string';
	}

	function isFunction(value) {
		return typeof value === 'function';
	}

	function isUndefined(value) {
		return value === undefined;
	}

	function isBoolean(value) {
		return typeof value === 'boolean';
	}

	function errorMessage(type, name, expected, actual) {
		var param = type ? ' parameter' : 'Parameter';
		return '' + type + param + ' \'' + name + '\' must be ' + expected + ', got ' + actual + ' instead';
	}

	function getSetConfig(params) {
		if (isUndefined(params)) {
			return {
				scrollThrottle: config.scrollThrottle,
				resizeThrottle: config.resizeThrottle,
				idleTimeout: config.idleTimeout
			};
		}

		Object.keys(params).forEach(function (key) {
			return setOption(key, params[key]);
		});

		if (clock > 0) {
			resetTicks();
		}
	}

	function setOption(key, value) {
		if (!(['scrollThrottle', 'resizeThrottle', 'idleTimeout'].indexOf(key) !== -1)) {
			throw new ReferenceError('Invalid config parameter: \'' + key + '\'');
		}
		var lowerLimit = key === 'idleTimeout' ? 0 : 1;
		if (!isNumber(value)) {
			throw new TypeError(errorMessage('Config', key, 'a number', value));
		} else if (value < lowerLimit) {
			throw new RangeError(errorMessage('Config', key, 'at least ' + lowerLimit, value));
		} else {
			config[key] = value;
		}
	}

	function resetTicks() {
		scrollTick = 1;
		resizeTick = 1;
	}

	exports.default = { add: add, remove: remove, start: start, stop: stop, refresh: refresh, config: getSetConfig };
	module.exports = exports['default'];
});

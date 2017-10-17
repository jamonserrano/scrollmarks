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
		global.ScrollMarks = mod.exports;
	}
})(this, function (module, exports) {
	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	/* eslint-env browser, es6 */

	/*
  * Scrollmarks
  * Copyright (c) 2017 Viktor Honti
  * Licensed under the MIT License.
  * https://github.com/jamonserrano/scrollmarks
  */

	// store for scrollmarks
	var scrollMarks = window.Map ? new Map() : createfakeMap();
	// index of scrollmarks
	var index = 0;
	// queue for triggered marks
	var queue = [];

	// started state
	var running = false;
	// central clock
	var clock = void 0;

	// document was scrolled
	var scrolled = false;
	// frame counter for scroll events
	var scrollTick = 0;
	// throttle for scroll events (configurable)
	var scrollThrottle = 10;
	// previous scroll position;
	var previousScroll = 0;
	// scroll direction
	var scrollDirection = void 0;

	// document was resized
	var resized = false;
	// frame counter for resize events
	var resizeTick = 0;
	// throttle for resize events (configurable)
	var resizeThrottle = 30;
	// documentElement cached
	var documentElement = document.documentElement;
	// previous document height
	var previousHeight = documentElement.scrollHeight;

	// browser supports idle callback
	var hasIdleCallback = Boolean(window.requestIdleCallback);
	// maximum allowed timeout (configurable)
	var idleTimeout = 100;

	// event listener properties (false by default)
	var listenerProperties = false;
	// set passive listener if available
	window.addEventListener("test", null, {
		get passive() {
			listenerProperties = {
				passive: true
			};
		}
	});

	/**
  * Add a new scrollmark
  * @public
  * @param {Object} mark
  * @param {HTMLElement} mark.element
  * @param {Function} mark.callback
  * @param {(number|string|function)} [mark.offset]
  * @param {('up'|'down')} [mark.direction]
  * @param {boolean} [mark.once]
  * @return {number} key
  */
	function add(mark) {
		var element = mark.element,
		    callback = mark.callback,
		    offset = mark.offset,
		    direction = mark.direction,
		    once = mark.once;


		if (!(element instanceof HTMLElement)) {
			throw new TypeError(errorMessage(false, 'element', 'an HTML Element', element));
		}

		if (!isFunction(callback)) {
			throw new TypeError(errorMessage(false, 'callback', 'a function', callback));
		}

		if (isUndefined(offset)) {
			// default
			mark.computedOffset = 0;
		} else if (typeof offset === 'string' && offset.endsWith('%')) {
			// generate function from percentage (viewport size can change)
			mark.computedOffset = function () {
				return window.innerHeight * parseInt(offset) / 100;
			};
		} else if (isNumber(offset) || isFunction(offset)) {
			mark.computedOffset = offset;
		} else {
			throw new TypeError(errorMessage('Optional', 'offset', 'a number, a percentage, or a function', offset));
		}

		if (!isUndefined(direction) && direction !== 'up' && direction !== 'down') {
			throw new TypeError(errorMessage('Optional', 'direction', '\'up\' or \'down\'', direction));
		}

		if (!isUndefined(once) && typeof once !== 'boolean') {
			throw new TypeError(errorMessage('Optional', 'once', 'boolean', once));
		}

		calculateTriggerPoint(mark);

		var key = index++;
		mark.key = key;
		scrollMarks.set(key, mark);

		if (!running) {
			start();
		} else if (directionMatches(direction, 'down') && mark.triggerPoint <= window.pageYOffset) {
			// we don't know how we got to the current position so only trigger the mark if it's above and accepts downscroll
			trigger(mark);
		}

		return key;
	}

	/**
  * Remove a scrollmark
  * @public
  * @param {number} key
  */
	function remove(key) {
		if (!scrollMarks.delete(key)) {
			throw new ReferenceError('Could not remove scrollmark \'' + key + '\', mark doesn\'t exist');
		}
		if (!scrollMarks.size) {
			stop();
		}
	}

	/**
  * Start listening
  * @public
  */
	function start() {
		if (!running) {
			running = true;
			checkMarks();

			window.addEventListener('scroll', onScroll, listenerProperties);
			window.addEventListener('resize', onResize, listenerProperties);
			clock = window.requestAnimationFrame(checkState);
		}
	}

	/**
  * Stop listening
  * @public
  */
	function stop() {
		if (running) {
			window.removeEventListener('scroll', onScroll, listenerProperties);
			window.removeEventListener('resize', onResize, listenerProperties);
			window.cancelAnimationFrame(clock);

			running = false;
			previousScroll = 0;
			resetTicks();
		}
	}

	/**
  * Scroll event listener
  * Sets the scrolled flag for the clock
  */
	function onScroll() {
		window.requestAnimationFrame(function () {
			return scrolled = true;
		});
	}

	/**
  * Resize listener
  * Sets the resized flag for the clock
  */
	function onResize() {
		window.requestAnimationFrame(function () {
			return resized = true;
		});
	}

	/**
  * Single handler for scroll, document height, and page resize
  */
	function checkState() {
		// resize check
		if (resizeTick === resizeThrottle) {
			if (resized) {
				// document was resized
				idle(updateTriggerPoints);
				resized = false;
			} else {
				// check the height
				var height = documentElement.scrollHeight;
				if (previousHeight !== height) {
					idle(updateTriggerPoints);
					previousHeight = height;
				}
			}
			resizeTick = 0;
		} else {
			resizeTick++;
		}

		// scroll check
		if (scrollTick === scrollThrottle) {
			if (scrolled) {
				checkMarks();
				scrolled = false;
			}
			scrollTick = 0;
		} else {
			scrollTick++;
		}

		clock = window.requestAnimationFrame(checkState);
	}

	/**
  * Checks if scrollmarks should be triggered
  */
	function checkMarks() {
		// get scroll position and direction
		var currentScroll = window.pageYOffset;
		scrollDirection = previousScroll < currentScroll ? 'down' : 'up';

		scrollMarks.forEach(function (mark) {
			var markDirection = mark.direction;
			// 1st check: element is visible and direction matches (or not defined)
			if (mark.element.offsetParent !== null && directionMatches(markDirection)) {
				var triggerPoint = mark.triggerPoint;
				// 2nd check: element actually crossed the mark (below -> above or above -> below)
				if (previousScroll < triggerPoint === triggerPoint <= currentScroll) {
					// mark should be triggered
					queue.push(mark);
				}
			}
		});
		// trigger affected marks
		triggerQueue();
		// prepare for next run
		previousScroll = currentScroll;
	}

	/**
  * Trigger affected scrollmarks
  */
	function triggerQueue() {
		// put trigger marks in order
		queue.sort(scrollDirection === 'down' ? sortAscending : sortDescending);
		// call each mark
		queue.forEach(trigger);
		// empty queue
		queue = [];
	}

	/**
  * Trigger a single mark
  * @param {Object} mark 
  */
	function trigger(mark) {
		mark.callback(mark, scrollDirection);

		if (mark.once) {
			remove(mark.key);
		}
	}

	/**
  * Sort by ascending triggerpoints
  * @param {Object} a mark 
  * @param {Object} b mark
  * @return {number}
  */
	function sortAscending(a, b) {
		return a.triggerPoint - b.triggerPoint;
	}

	/**
  * Sort by descending triggerpoints
  * @param {Object} a mark 
  * @param {Object} b mark
  * @return {number}
  */
	function sortDescending(a, b) {
		return b.triggerPoint - a.triggerPoint;
	}

	/**
  * Check if the mark's direction matches the current (or provided) scroll direction
  * @param {('up'|'down'|undefined)} markDirection 
  * @param {('up'|'down')} [direction]
  * @return {boolean} match
  */
	function directionMatches(markDirection, direction) {
		return !markDirection || markDirection === (direction || scrollDirection);
	}

	/**
  * Update all trigger points
  */
	function updateTriggerPoints() {
		scrollMarks.forEach(calculateTriggerPoint);
	}

	/**
  * Calculate a trigger point
  * @param {Object} mark 
  */
	function calculateTriggerPoint(mark) {
		var computedOffset = mark.computedOffset;
		var offsetValue = isFunction(computedOffset) ? computedOffset(mark.element) : computedOffset;
		mark.triggerPoint = window.pageYOffset + mark.element.getBoundingClientRect().top - offsetValue;
	}

	/**
  * Refresh one or all marks
  * @public
  * @param {number} [key] 
  */
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

	/**
  * Idle callback shim
  * @param {Function} func 
  */
	function idle(func) {
		if (hasIdleCallback) {
			window.requestIdleCallback(func, { timeout: idleTimeout });
		} else {
			window.setTimeout(func, 0);
		}
	}

	/**
  * Create a fake Map object
  * @return {Object}
  */
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

	/**
  * Checks if the value is a number
  * @param {*} value 
  * @return {boolean}
  */
	function isNumber(value) {
		return typeof value === 'number';
	}

	/**
  * Checks if the value is a function
  * @param {*} value 
  * @return {boolean}
  */
	function isFunction(value) {
		return typeof value === 'function';
	}

	/**
  * Checks if the value is undefined
  * @param {*} value 
  * @return {boolean}
  */
	function isUndefined(value) {
		return value === undefined;
	}

	/**
  * Composes an error message
  * @param {string} type
  * @param {string} name
  * @param {string} expected
  * @param {*} actual
  * @return {string}
  */
	function errorMessage(type, name, expected, actual) {
		var param = type ? ' parameter' : 'Parameter';
		return '' + type + param + ' \'' + name + '\' must be ' + expected + ', got ' + actual + ' instead';
	}

	/**
  * Set options
  * @public
  * @param {Object} options 
  * @param {number} options.scrollThrottle
  * @param {number} options.resizeThrottle
  * @param {number} options.idleTimeout
  */
	function config(options) {
		if (isUndefined(options)) {
			return { scrollThrottle: scrollThrottle, resizeThrottle: resizeThrottle, idleTimeout: idleTimeout };
		}
		if (isValidOption(options, 'scrollThrottle')) {
			debugger;
			scrollThrottle = options.scrollThrottle;
		}

		if (isValidOption(options, 'resizeThrottle')) {
			resizeThrottle = options.resizeThrottle;
		}

		if (isValidOption(options, 'idleTimeout')) {
			idleTimeout = options.idleTimeout;
		}

		if (running) {
			resetTicks();
		}
	}

	/**
  * Validate a config option
  * @param {Object} options 
  * @param {string} key 
  */
	function isValidOption(options, key) {
		var value = options[key];
		if (isUndefined(value)) {
			return false;
		} else if (!isNumber(value)) {
			throw new TypeError(errorMessage('Config', key, 'a number', value));
		} else if (value < 0) {
			throw new RangeError(errorMessage('Config', key, 'at least 0', value));
		} else {
			return true;
		}
	}

	/**
  * Reset ticks
  */
	function resetTicks() {
		scrollTick = 0;
		resizeTick = 0;
	}

	exports.default = { add: add, remove: remove, start: start, stop: stop, config: config, refresh: refresh };
	module.exports = exports['default'];
});

/**
 * @license
 * Scrollmarks 1.0.2
 * Copyright (c) 2017 Viktor Honti
 * Licensed under the MIT License.
 * https://github.com/jamonserrano/scrollmarks
 */

// store for scrollmarks
const scrollMarks = window.Map ? new Map() : createMockMap();
// configuration
const config = {
	// throttle for scroll events (configurable)
	scrollThrottle: 10,
	// throttle for resize events (configurable)
	resizeThrottle: 30,
	// maximum allowed timeout (configurable, 0 to trigger instantly)
	idleTimeout: 100
};
// browser supports idle callback
const hasIdleCallback = Boolean(window.requestIdleCallback);

// index of scrollmarks
let index = 0;
// actively listening
let active = false;
// document was scrolled
let scrolled = false;
// frame counter for scroll events
let scrollTick = 1;
// previous scroll position;
let previousScroll = 0;
// scroll direction
let scrollDirection;
// document was resized
let resized = false;
// frame counter for resize events
let resizeTick = 1;
// previous document height
let previousHeight = document.body.scrollHeight;

// event listener properties (false by default)
let listenerProperties = false;
// set passive listener if available
window.addEventListener("test", null, {
	get passive() {
		listenerProperties = {
			passive: true
		}
	}
});

window.addEventListener('scroll', onScroll, listenerProperties);
window.addEventListener('resize', onResize, listenerProperties);
window.requestAnimationFrame(checkState);

/**
 * Add a new scrollmark
 * @public
 * @param {Object} mark
 * @param {HTMLElement} mark.element
 * @param {Function} mark.callback
 * @param {(number|string|function)} [mark.offset]
 * @param {('up'|'down')} [mark.direction]
 * @param {boolean} [mark.once]
 * @param {boolean} [mark.debug]
 * @return {number} key
 */
function add(mark) {
	const { element, callback, offset, direction, once, debug } = mark;

	if (!(element instanceof HTMLElement)) {
		throw new TypeError(errorMessage('', 'element', 'an HTML Element', element));
	}

	if (!isFunction(callback)) {
		throw new TypeError(errorMessage('', 'callback', 'a function', callback));
	}

	if (isUndefined(offset)) {
		// default
		mark.computedOffset = 0;
	} else if (isNumber(offset) || isFunction(offset)) {
		mark.computedOffset = offset;
	} else if (isString(offset) && offset.slice(-1) === '%') {
		// generate function from percentage (viewport size can change)
		mark.computedOffset = () => window.innerHeight * parseInt(offset) / 100;
	} else if (isString(offset) && offset.slice(-2) === 'px') {
		mark.computedOffset = parseInt(offset);
	} else {
		throw new TypeError(errorMessage('Optional', 'offset', 'a number, px, %, or a function', offset));
	}

	if (!isUndefined(direction) && direction !== 'up' && direction !== 'down') {
		throw new TypeError(errorMessage('Optional', 'direction', `'up' or 'down'`, direction));
	}

	if (!(isUndefined(once) || isBoolean(once))) {
		throw new TypeError(errorMessage('Optional', 'once', 'boolean', once));
	}

	if (!(isUndefined(debug) || isBoolean(debug))) {
		throw new TypeError(errorMessage('Optional', 'debug', 'boolean', debug));
	}

	calculateTriggerPoint(mark);

	const key = index++;
	mark.key = key;
	scrollMarks.set(key, mark);

	// we need to check newly added marks manually because the scroll position can be anything, even without a scroll event (e.g. page reload)
	if (directionMatches(direction, 'down') && mark.triggerPoint <= previousScroll) {
		trigger(mark);
	}

	start();

	return key;
}

/**
 * Remove a scrollmark
 * @public
 * @param {number} key
 * @return {boolean} delete success
 */
function remove(key) {
	removeHelperElement(key);

	const success = scrollMarks.delete(key);
	if (!scrollMarks.size) {
		stop();
	}
	return success;
}

/**
 * Start listening
 * @public
 */
function start() {
	active = true;
}

/**
 * Stop listening
 * @public
 */
function stop() {
	active = false;
}

/**
 * Scroll event listener
 * Sets the scrolled flag for the clock
 */
function onScroll() {
	window.requestAnimationFrame(() => scrolled = true);
}

/**
 * Resize listener
 * Sets the resized flag for the clock
 */
function onResize() {
	window.requestAnimationFrame(() => resized = true);
}

/**
 * Single handler for scroll, document height, and page resize
 */
function checkState() {
	window.requestAnimationFrame(checkState);

	// resize check
	if (resizeTick === config.resizeThrottle) {
		if (resized) {
			// document was resized
			idle(updateTriggerPoints);
			resized = false;
		} else {
			// check the height
			const height = document.body.scrollHeight;
			if (previousHeight !== height) {
				idle(updateTriggerPoints);
				previousHeight = height;
			}
		}
		resizeTick = 1;
	} else {
		resizeTick++;
	}

	// scroll check
	if (scrollTick === config.scrollThrottle) {
		if (scrolled) {
			checkMarks();
			scrolled = false;
		}
		scrollTick = 1;
	} else {
		scrollTick++;
	}

}

/**
 * Checks if scrollmarks should be triggered
 */
function checkMarks() {
	const currentScroll = window.pageYOffset;
	if (active) {
		const queue = [];
		// get scroll position and direction
		scrollDirection = previousScroll < currentScroll ? 'down' : 'up';

		scrollMarks.forEach((mark) => {
			const markDirection = mark.direction;
			// 1st check: element is visible and direction matches (or not defined)
			if (mark.element.offsetParent !== null && directionMatches(markDirection)) {
				const triggerPoint = mark.triggerPoint;
				// 2nd check: element actually crossed the mark (below -> above or above -> below)
				if ((previousScroll < triggerPoint) === (triggerPoint <= currentScroll)) {
					// mark should be triggered
					queue.push(mark);
				}
			}
		});
		// trigger affected marks
		if (queue.length) {
			triggerQueue(queue);
		}
	}
	// prepare for next run
	previousScroll = currentScroll;
}

/**
 * Trigger affected scrollmarks
 * @param {Array} queue
 */
function triggerQueue(queue) {
	// put trigger marks in order
	queue.sort(scrollDirection === 'down' ? sortAscending : sortDescending);
	// call each mark
	queue.forEach(trigger);
}

/**
 * Trigger a single mark
 * @param {Object} mark
 */
function trigger(mark) {
	const once = mark.once;
	mark.callback(scrollDirection, mark);

	if (once) {
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
	const computedOffset = mark.computedOffset;
	const offsetValue = isFunction(computedOffset) ? computedOffset(mark.element) : computedOffset;

	if (!isNumber(offsetValue)) {
		throw new TypeError(`Offset function must return a number, got ${offsetValue} instead`);
	}

	mark.triggerPoint = window.pageYOffset + mark.element.getBoundingClientRect().top - offsetValue;

	if (mark.debug) {
		setHelperElement(mark);
	}
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
		idle(() => calculateTriggerPoint(scrollMarks.get(key)));
	} else {
		throw new ReferenceError(`Could not refresh scrollmark '${key}', mark doesn't exist`);
	}
}

/**
 * Idle callback
 * @param {Function} callback
 */
function idle(callback) {
	const idleTimeout = config.idleTimeout;
	if (idleTimeout === 0) {
		callback();
	} else if (hasIdleCallback) {
		window.requestIdleCallback(callback, { timeout: idleTimeout });
	} else {
		window.setTimeout(callback, 0);
	}
}

/**
 * Create helper element for debugging
 * @param {Object} mark 
 */
function setHelperElement(mark) {
	let helperElement = mark.helper;

	if (!helperElement) {
		helperElement = document.createElement('div');
		helperElement.className = 'scrollmarks-helper';
		helperElement.style.cssText = 'background:#67CF93;border-top:2px solid;color:#333;font:14px monospace;left:0;min-height:20px;padding:0 3px;position:absolute;width:100%;z-index:9999;';

		mark.helper = helperElement;
		document.body.appendChild(helperElement);
	}

	helperElement.style.top = `${mark.triggerPoint}px`;
	helperElement.innerHTML = `offset: ${mark.offset}, computedOffset: ${isFunction(mark.computedOffset) ? mark.computedOffset(mark.element) : mark.computedOffset}, triggerPoint: ${mark.triggerPoint}px`;
}

/**
 * Remove helper element
 * @param {number} key 
 */
function removeHelperElement(key) {
	// remove helper element
	const mark = scrollMarks.get(key);

	if (mark && mark.helper) {
		document.body.removeChild(mark.helper);
	}
}

/**
 * Create a mock Map object
 * @return {Object}
 */
function createMockMap() {
	return Object.defineProperties(Object.create(null), {
		'delete': {
			value: function (key) {
				return this.has(key) && delete this[key];
			}
		},
		'forEach': {
			value: function (callback) {
				Object.keys(this).forEach(key => callback(this[key], key, this));
			}
		},
		'get': {
			value: function (key) {
				return this[key];
			}
		},
		'has': {
			value: function (key) {
				return !isUndefined(this[key]);
			}
		},
		'set': {
			value: function (key, value) {
				this[key] = value;
				return this;
			}
		},
		'size': {
			get() {
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
 * Checks if the value is a string
 * @param {*} value
 * @return {boolean}
 */
function isString(value) {
	return typeof value === 'string';
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
 * Checks if the value is boolean
 * @param {*} value
 * @return {boolean}
 */
function isBoolean(value) {
	return typeof value === 'boolean';
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
	const param = type ? ' parameter' : 'Parameter';
	return `${type}${param} '${name}' must be ${expected}, got ${actual} instead`;
}

/**
 * Set options
 * @public
 * @param {Object} params
 * @param {number} options.scrollThrottle
 * @param {number} options.resizeThrottle
 * @param {number} options.idleTimeout
 */
function getSetConfig(params) {
	// get
	if (isUndefined(params)) {
		return {
			scrollThrottle: config.scrollThrottle,
			resizeThrottle: config.resizeThrottle,
			idleTimeout: config.idleTimeout
		};
	}
	// set
	Object.keys(params).forEach((key) => setOption(key, params[key]));

	scrollTick = 1;
	resizeTick = 1;
}

/**
 * Set a config value
 * @param {string} key
 * @param {number} value
 */
function setOption(key, value) {
	if (!['scrollThrottle', 'resizeThrottle', 'idleTimeout'].includes(key)) {
		throw new ReferenceError(`Invalid config parameter: '${key}'`);
	}
	const lowerLimit = key === 'idleTimeout' ? 0 : 1;
	if (!isNumber(value)) {
		throw new TypeError(errorMessage('Config', key, 'a number', value));
	} else if (value < lowerLimit) {
		throw new RangeError(errorMessage('Config', key, `at least ${lowerLimit}`, value));
	} else {
		config[key] = value;
	}
}

export default { add, remove, start, stop, refresh, config: getSetConfig };

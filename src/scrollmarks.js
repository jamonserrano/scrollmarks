/* eslint-env browser, amd, commonjs, es6 */

/*
 * Scrollmarks
 * Copyright (c) 2017 Viktor Honti
 * Licensed under the MIT License.
 * https://github.com/jamonserrano/scrollmarks
 */

// store for scrollmarks
const scrollMarks = window.Map ? new Map() : createfakeMap();
// index of scrollmarks
let index = 0;
// queue for triggered marks
let queue = [];

// started state
let running = false;
// central clock
let clock;

// document was scrolled
let scrolled = false;	
// frame counter for scroll events
let scrollTick = 0;
// throttle for scroll events (configurable)
let scrollThrottle = 10;
// previous scroll position;
let previousScroll = 0;
// scroll direction
let scrollDirection;

// document was resized
let resized = false;
// frame counter for resize events
let resizeTick = 0;
// throttle for resize events (configurable)
let resizeThrottle = 30;
// documentElement cached
const documentElement = document.documentElement;
// previous document height
let previousHeight = documentElement.scrollHeight;

// browser supports idle callback
const hasIdleCallback = window.requestIdleCallback;
// maximum allowed timeout (configurable)
let idleTimeout = 100;

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
function add (mark) {
	const { element, callback, offset, direction, once } = mark;

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
		mark.computedOffset = () => window.innerHeight * parseInt(offset) / 100;
	} else if (isNumber(offset) || isFunction(offset)) {
		mark.computedOffset = offset;
	} else {
		throw new TypeError(errorMessage('Optional', 'offset', 'a number, a percentage, or a function', offset));
	}
	
	if (direction && direction !== 'up' && direction !== 'down') {
		throw new TypeError(errorMessage('Optional', 'direction', `'up' or 'down'`, direction));
	}

	if (!isUndefined(once) && once !== true) {
		throw new TypeError(errorMessage('Optional', 'once', 'true', once));
	}

	calculateTriggerPoint(mark);
	
	const key = index++;
	mark.key = key;		
	scrollMarks.set(key, mark);
	
	if (!running) {
		start();
	} else if (directionMatches(direction, 'down') && mark.triggerPoint <= window.pageYOffset) {
		// don't wait until the next event to trigger the mark
		trigger(mark);
	}

	return key;
}

/**
 * Remove a scrollmark
 * @public
 * @param {number} key
 */
function remove (key) {
	if (!scrollMarks.delete(key)) {
		throw new ReferenceError(`Could not remove scrollmark '${key}', mark doesn't exist`);
	}
	if (!scrollMarks.size) {
		stop();
	}
}

/**
 * Start listening
 * @public
 */
function start () {
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
function stop () {
	if (running) {
		window.removeEventListener('scroll', onScroll, listenerProperties);
		window.removeEventListener('resize', onResize, listenerProperties);
		window.cancelAnimationFrame(clock);
		
		running = false;
		resetTicks();
	}
}

/**
 * Scroll event listener
 * Sets the scrolled flag for the clock
 */
function onScroll () {
	window.requestAnimationFrame(() => scrolled = true);
}

/**
 * Resize listener
 * Sets the resized flag for the clock
 */
function onResize () {
	window.requestAnimationFrame(() => resized = true);
}

/**
 * Single handler for scroll, document height, and page resize
 */
function checkState () {
	// resize check
	if (resizeTick === resizeThrottle) {
		if (resized) {
			// document was resized
			idle(updateTriggerPoints);
			resized = false;
		} else {
			// check the height
			const height = documentElement.scrollHeight;
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
function checkMarks () {
	// get scroll position and direction
	const currentScroll = window.pageYOffset;
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
	triggerQueue();
	// prepare for next run
	previousScroll = currentScroll;
}

/**
 * Trigger affected scrollmarks
 */
function triggerQueue () {
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
	mark.callback(mark, scrollDirection)

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
function sortAscending (a,b) {
	return a.triggerPoint - b.triggerPoint;
}

/**
 * Sort by descending triggerpoints
 * @param {Object} a mark 
 * @param {Object} b mark
 * @return {number}
 */
function sortDescending (a,b) {
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
function updateTriggerPoints () {
	scrollMarks.forEach(calculateTriggerPoint);
}

/**
 * Calculate a trigger point
 * @param {Object} mark 
 */
function calculateTriggerPoint (mark) {
	const computedOffset = mark.computedOffset;
	const offsetValue = isFunction(computedOffset) ? computedOffset(mark.element) : computedOffset;
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
		idle(() => calculateTriggerPoint(scrollMarks.get(key)));
	} else {
		throw new ReferenceError(`Could not refresh scrollmark '${key}', mark doesn't exist`);
	}
}

/**
 * Idle callback shim
 * @param {Function} func 
 */
function idle(func) {
	if (hasIdleCallback) {
		window.requestIdleCallback(func, {timeout: idleTimeout});
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
				return this.hasOwnProperty(key);
			}
		},
		'set': {
			value: function (key, value) {
				this[key] = value;
				return this;
			}
		},
		'size': {
			get: function () {
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
	const param = type ? ' parameter' : 'Parameter';
	return `${type}${param} '${name}' must be ${expected}, got ${actual} instead`;
}

/**
 * Set options
 * @public
 * @param {Object} options 
 * @param {number} options.scrollThrottle
 * @param {number} options.resizeThrottle
 * @param {number} options.idleTimeout
 */
function config (options) {
	const newScrollThrottle = options.scrollThrottle;
	const newResizeThrottle = options.resizeThrottle;
	const newIdleTimeout = options.idleTimeout;

	if (!isNumber(newScrollThrottle)) {
		throw new TypeError(errorMessage('Config', 'scrollThrottle', 'a number', newScrollThrottle));
	} else if (newScrollThrottle < 0) {
		throw new RangeError(errorMessage('Config', 'scrollThrottle', 'at least 0', newScrollThrottle));
	} else {
		scrollThrottle = newScrollThrottle;
	}

	if (!isNumber(newResizeThrottle)) {
		throw new TypeError(errorMessage('Config', 'resizeThrottle', 'a number', newResizeThrottle));
	} else if (newResizeThrottle < 0) {
		throw new RangeError(errorMessage('Config', 'resizeThrottle', 'at least 0', newResizeThrottle));
	} else {
		resizeThrottle = newResizeThrottle;
	}

	if (!isNumber(newIdleTimeout)) {
		throw new TypeError(errorMessage('Config', 'idleTimeout', 'a number', newIdleTimeout));
	} else if (newIdleTimeout < 1) {
		throw new RangeError(errorMessage('Config', 'idleTimeout', 'a positive number', newIdleTimeout));
	} else {
		idleTimeout = newIdleTimeout;
	}

	if (running) {
		resetTicks();
	}
}

/**
 * Reset ticks
 */
function resetTicks() {
	scrollTick = 0;
	resizeTick = 0;
}

export default {add, remove, start, stop, config, refresh};

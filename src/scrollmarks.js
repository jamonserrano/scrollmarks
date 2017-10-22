/* eslint-env browser, es6, amd, commonjs */

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

// central clock, 0 when stopped, arbitrary number (the return value of requestAnimationFrame) when running
let clock = 0;

// document was scrolled
let scrolled = false;	
// frame counter for scroll events
let scrollTick = 1;
// throttle for scroll events (configurable)
let scrollThrottle = 10;
// previous scroll position;
let previousScroll = 0;
// scroll direction
let scrollDirection;

// document was resized
let resized = false;
// frame counter for resize events
let resizeTick = 1;
// throttle for resize events (configurable)
let resizeThrottle = 30;
// documentElement cached
const documentElement = document.documentElement;
// previous document height
let previousHeight = documentElement.scrollHeight;

// browser supports idle callback
const hasIdleCallback = Boolean(window.requestIdleCallback);
// maximum allowed timeout (configurable, 0 to trigger instantly)
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
	const { element, callback, offset, direction, once, debug } = mark;

	if (!(element instanceof HTMLElement)) {
		throw new TypeError(errorMessage(false, 'element', 'an HTML Element', element));
	}
	
	if (!isFunction(callback)) {
		throw new TypeError(errorMessage(false, 'callback', 'a function', callback));
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
	
	const key = index++;
	mark.key = key;		
	scrollMarks.set(key, mark);
	
	calculateTriggerPoint(mark);

	if (clock === 0) {
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
 * @return {boolean} delete success
 */
function remove (key) {
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
function start () {
	if (clock === 0) {
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
	if (clock > 0) {
		window.cancelAnimationFrame(clock);
		window.removeEventListener('scroll', onScroll, listenerProperties);
		window.removeEventListener('resize', onResize, listenerProperties);
		
		clock = 0;
		previousScroll = 0;
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
		resizeTick = 1;
	} else {
		resizeTick++;
	}

	// scroll check
	if (scrollTick === scrollThrottle) {
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
	mark.callback(scrollDirection, mark)

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
	if (idleTimeout === 0) {
		callback();
	} else if (hasIdleCallback) {
		window.requestIdleCallback(callback, {timeout: idleTimeout});
	} else {
		window.setTimeout(callback, 0);
	}
}

function setHelperElement(mark) {
	if (!mark.debug) {
		return;
	}

	let helperElement = mark.helper;
	if (!helperElement) {
		helperElement = document.createElement('div');
		Object.assign(helperElement.style, {
			borderTop: '1px solid red',
			color: 'red',
			fontFamily: 'sans-serif',
			fontSize: '14px',
			left: '0',
			minHeight: '20px',
			padding: '3px',
			position: 'absolute',
			width: '100%'
		});

		mark.helper = helperElement;
		document.body.appendChild(helperElement);
	}

	helperElement.style.top = `${mark.triggerPoint}px`;
	helperElement.innerHTML = `offset: ${mark.offset}, computedOffset: ${isFunction(mark.computedOffset) ? mark.computedOffset(mark.element) : mark.computedOffset}, triggerPoint: ${mark.triggerPoint}px`;
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
 * @param {Object} options 
 * @param {number} options.scrollThrottle
 * @param {number} options.resizeThrottle
 * @param {number} options.idleTimeout
 */
function config (options) {
	// get
	if (isUndefined(options)) {
		return { scrollThrottle, resizeThrottle, idleTimeout };
	}
	// set
	if (isValidOption(options, 'scrollThrottle')) {
		scrollThrottle = options.scrollThrottle;
	}

	if (isValidOption(options, 'resizeThrottle')) {
		resizeThrottle = options.resizeThrottle;
	}

	if (isValidOption(options, 'idleTimeout')) {
		idleTimeout = options.idleTimeout;
	}

	if (clock > 0) {
		resetTicks();
	}
}

/**
 * Validate a config option
 * @param {Object} options 
 * @param {string} key 
 */
function isValidOption(options, key) {
	const value = options[key];
	const lowerLimit = key === 'idleTimeout' ? 0 : 1;	
	if (isUndefined(value)) {
		return false;
	} else if (!isNumber(value)) {
		throw new TypeError(errorMessage('Config', key, 'a number', value));
	} else if (value < lowerLimit) {
		throw new RangeError(errorMessage('Config', key, `at least ${lowerLimit}`, value));
	} else {
		return true;
	}
}

/**
 * Reset ticks
 */
function resetTicks() {
	scrollTick = 1;
	resizeTick = 1;
}

export default { add, remove, start, stop, config, refresh };

/* eslint-env browser, amd, commonjs, es6 */

/*
 * Scrollmarks
 * Copyright (c) 2017 Viktor Honti
 * Licensed under the MIT License.
 * https://github.com/jamonserrano/scrollmarks
 */

"use strict";
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ScrollMarks = factory();
	}
}(this, function () {
	// store for scrollmarks
	const scrollMarks = new Map();
	// index of scrollmarks
	let index = 0;
	// queue for triggered marks
	let queue = [];
	
	// documentElement cached
	const documentElement = document.documentElement;
	// previous document height
	let previousHeight = documentElement.offsetHeight;
	
	// started state
	let running = false;
	// previous scroll position;
	let previousScroll = 0;
	// central clock
	let clock;
	// scroll direction
	let direction;
	
	// document was scrolled
	let scrolled = false;	
	// frame counter for scroll events
	let scrollTick = 0;
	// throttle for scroll events (configurable)
	let scrollThrottle = 10;
	
	// document was resized
	let resized = false;
	// frame counter for resize events
	let resizeTick = 0;
	// throttle for resize events (configurable)
	let resizeThrottle = 30;

	// browser support idle callback
	const hasIdleCallback = window.requestIdleCallback;
	// maximum allowed timeout (configurable)
	let idleTimeout = 100;
	
	// event listener properties (false by default)
	let listenerProperties = false;
	// set listener properties object if available
	window.addEventListener("test", null, {
		get passive() {
			listenerProperties = {
				passive: true
			}
		}
	});

	/**
	 * Add a new scrollmark
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
		// validate element
		if (!(element instanceof HTMLElement)) {
			throw new TypeError(`Parameter 'element' must be an HTML Element, got ${element} instead`);
		}
		// validate callback
		if (typeof callback !== 'function') {
			throw new TypeError(`Parameter 'callback' must be a function, got ${callback} instead`);
		}
		// validate offset
		if (typeof offset === 'undefined') {
			mark.offset = 0;
		} else if (typeof offset === 'string' && offset.endsWith('%')) {
			mark.offset = (element) => window.pageYOffset + element.getBoundingClientRect().top - window.innerHeight * parseInt(offset) / 100;
		} else if (Number.isNaN(offset) && typeof offset !== 'function') {
			throw new TypeError(`Optional parameter 'offset' must be a number, a percentage, or a function, got ${offset} instead`);
		}
		// validate direction
		if (direction && direction !== 'up' && direction !== 'down') {
			throw new TypeError(`Optional parameter 'direction' must be either 'up' or 'down', got ${direction} instead`);
		}
		// validate once
		if (typeof once !== 'undefined' && typeof once !== 'boolean') {
			throw new TypeError(`Optional parameter 'once' must be true or false, got ${once} instead`);
		}

		// add triggerpoint
		calculateTriggerPoint(mark);
		
		// generate key
		const key = index++;
		mark.key = key;		
		
		// add scrollmark to list
		scrollMarks.set(key, mark);
		
		// start listening
		if (!running) {
			start();
		}
		// TODO trigger if already passed?
		return key;
	}

	/**
	 * Remove a scrollmark
	 * @param {number} key
	 */
	function remove (key) {
		scrollMarks.delete(key);
		if (!scrollMarks.size) {
			stop();
		}
	}

	/**
	 * Start listening
	 */
	function start () {
		if (running) {
			return;
		}
		running = true;
		// the document can already be scrolled so run a check
		checkMarks();
		window.addEventListener('scroll', onScroll, listenerProperties);
		window.addEventListener('resize', onResize, listenerProperties);
		clock = window.requestAnimationFrame(checkState);
	}

	/**
	 * Stop listening
	 */
	function stop () {
		if (!running) {
			return;
		}
		window.removeEventListener('scroll', onScroll, listenerProperties);
		window.removeEventListener('resize', onResize, listenerProperties);
		window.cancelAnimationFrame(clock);
		
		running = false;
		resetTicks();
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
				const height = documentElement.offsetHeight;
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
		direction = previousScroll < currentScroll ? 'down' : 'up';
		
		scrollMarks.forEach((mark) => {
			const markDirection = mark.direction;
			// 1st check: element is visible and direction matches (or not defined)
			if (mark.element.offsetParent !== null && (!markDirection || markDirection === direction)) {
				const triggerPoint = mark.triggerPoint;
				// 2nd check: element actually crossed the mark (below -> above or above -> below)
				// from https://github.com/imakewebthings/waypoints
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
		if (direction === 'down') {
			queue.sort((a,b) => a.triggerPoint - b.triggerPoint);
		} else {
			queue.sort((a,b) => b.triggerPoint - a.triggerPoint);
		}
		// call each mark
		queue.forEach((mark) => {
			// TODO bind the callback?
			mark.callback(mark.element, direction)
			// delete onetime marks
			if (mark.once) {
				remove(mark.key);
			}
		});
		// empty queue
		queue = [];
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
		mark.triggerPoint = typeof mark.offset === 'function' ?
			mark.offset(mark.element) :
			window.pageYOffset + mark.element.getBoundingClientRect().top - mark.offset;
	}

	/**
	 * Run an idle callback
	 * @param {Function} func 
	 */
	function idle(func) {
		if (hasIdleCallback) {
			window.requestIdleCallback(func, {timeout: idleTimeout});
		} else {
			window.setTimeout(func, idleTimeout);
		}
	}

	/**
	 * Refresh one or all marks
	 * @param {number} [key] 
	 */
	function refresh(key) {
		if (typeof key !== 'undefined' && scrollMarks.has(key)) {
			idle(() => calculateTriggerPoint(scrollMarks.get(key)));
		} else {
			idle(updateTriggerPoints);
		}
	}

	/**
	 * Set options
	 * @param {Object} options 
	 * @param {number} options.scrollThrottle
	 * @param {number} options.resizeThrottle
	 * @param {number} options.idleTimeout
	 */
	function config (options) {
		const newScrollThrottle = options.scrollThrottle;
		const newResizeThrottle = options.resizeThrottle;
		const newIdleTimeout = options.idleTimeout;

		if (!isNaN(newScrollThrottle) && newScrollThrottle > -1) {
			scrollThrottle = options.scrollThrottle;
		}
		if (!isNaN(newResizeThrottle) && newResizeThrottle > -1) {
			resizeThrottle = options.resizeThrottle;
		}
		if (!isNaN(newIdleTimeout) && newIdleTimeout > -1) {
			idleTimeout = options.idleTimeout;
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

	return {add, remove, start, stop, config, refresh};
}));
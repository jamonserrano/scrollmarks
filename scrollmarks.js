/*
 *  Copyright (c) 2017 Viktor Honti
 *  Licensed under the MIT License.
 *  https://github.com/jamonserrano/scrollmarks
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
	// store for the scrollmarks
	const scrollMarks = new Map();
	// documentElement cached
	const documentElement = document.documentElement;
	// index of scrollmarks
	let index = 0;
	// started state
	let started = false;
	// frame counter for scroll events
	let scrollTick = 0;
	// throttle for scroll events
	let scrollThrottle = 0;
	// frame counter for resize events
	let resizeTick = 0;
	// throttle for resize events
	let resizeThrottle = 30;
	// previous scroll position;
	let previousScroll = 0;
	// previous document height
	let previousHeight = documentElement.offsetHeight;
	// listener for document height changes
	let heightChecker;
	// scroll direction
	let direction;
	// queue for triggered marks
	let queue = [];
	// document was resized
	let resized = false;
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
	 * @return {Number} index
	 */
	function add (mark) {
		const { element, callback, offset, direction, once } = mark;
		// validate params
		if (!(element instanceof HTMLElement)) {
			throw new TypeError(`Parameter 'element' must be an HTML Element, got ${element} instead`);
		}
		if (typeof callback !== 'function') {
			throw new TypeError(`Parameter 'callback' must be a function, got ${callback} instead`);
		}
		if (typeof offset === 'undefined') {
			mark.offset = 0;
		} else if (Number.isNaN(offset) && typeof offset !== 'function') {
			throw new TypeError(`Optional parameter 'offset' must be a number or a function, got ${offset} instead`);
		}
		if (direction && direction !== 'up' && direction !== 'down') {
			throw new TypeError(`Optional parameter 'direction' must be either 'up' or 'down', got ${direction} instead`);
		}
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
		if (!started) {
			start();
		}
		// TODO trigger if already passed?
		return key;
	}

	/**
	 * Remove a scrollmark
	 * @param {Number} index scrollmark index
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
		if (started) {
			return;
		}
		started = true;
		// scroll
		window.addEventListener('scroll', onScroll, listenerProperties);
		// resize
		window.addEventListener('resize', onResize, listenerProperties);
		// document height
		heightChecker = window.requestAnimationFrame(checkDocumentHeight);
		// the document can already be scrolled so run a check
		checkMarks();
	}

	/**
	 * Stop listening
	 */
	function stop () {
		if (!started) {
			return;
		}
		started = false;
		// scroll
		window.removeEventListener('scroll', onScroll, listenerProperties);
		// resize
		window.removeEventListener('resize', onResize, listenerProperties);
		// document height
		window.cancelAnimationFrame(heightChecker);
	}

	/**
	 * Scroll event listener
	 * Calls rAF on every nth event (or nth frame in Chrome and FF)
	 */
	function onScroll () {
		if (scrollTick === scrollThrottle) {
			scrollTick = 0;
			window.requestAnimationFrame(checkMarks);
		} else {
			scrollTick++;
		}
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
			// 1st check: element is visible and direction matches (or undefined)
			if (mark.element.offsetParent !== null && (!markDirection || markDirection === direction)) {
				const triggerPoint = mark.triggerPoint;
				// blatant ripoff of Waypoints https://github.com/imakewebthings/waypoints
				const wasBefore = previousScroll < triggerPoint;
				const isAfter = triggerPoint <= currentScroll;
				// 2nd check: element actually crossed the mark
				if (wasBefore === isAfter) {
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
	 * Trigger scrollmarks
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
	 * Set the resized flag
	 * TODO throttle
	 */
	function onResize () {
		resized = true;
	}

	/**
	 * Handle document height and page resize
	 * Both mean that the offsets should be recalculated
	 */
	function checkDocumentHeight () {
		if (resizeTick === resizeThrottle) {
			// time to check the height
			const height = documentElement.offsetHeight;
			if (previousHeight !== height) {
				updateTriggerPoints();
				previousHeight = height;
			}
			// reset the ticker
			resizeTick = 0;
		} else if (resized) {
			// document was resized
			updateTriggerPoints();
			resized = false;
			// reset the ticker anyway to win some time until the next call
			resizeTick = 0;
		} else {
			resizeTick++;
		}

		heightChecker = window.requestAnimationFrame(checkDocumentHeight);
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
			mark.element.offsetTop - mark.offset;
	}

	/**
	 * Set options
	 * @param {Object} options 
	 */
	function config (options) {
		scrollThrottle = options.scrollThrottle;
		resizeThrottle = options.resizeThrottle;
	}

	return {add, remove, start, stop, config};
}));
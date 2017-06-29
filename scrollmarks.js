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
	 * @param {Object} params 
	 * @return {Number} index
	 */
	function add (params) {
		// todo validate params
		// element, callback, once, direction
		const key = index++;
		params.triggerPoint = typeof offset === 'function' ? params.offset(params.element) : params.element.offsetTop - params.offset;
		params.key = key;
		scrollMarks.set(key, params);
		if (!started) {
			start();
		}
		// todo trigger if already passed?
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
		window.addEventListener('scroll', onScroll, listenerProperties);
		window.addEventListener('resize', onResize, listenerProperties);
		heightChecker = window.requestAnimationFrame(checkDocumentHeight);
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
		window.removeEventListener('scroll', onScroll, listenerProperties);
		window.removeEventListener('resize', onResize, listenerProperties);
		window.cancelAnimationFrame(heightChecker);
	}

	/**
	 * Scroll event listener
	 * Calls rAF on every nth event
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
		const currentScroll = window.pageYOffset;
		direction = previousScroll < currentScroll ? 'down' : 'up';
		scrollMarks.forEach((mark) => {
			const markDirection = mark.direction;
			// 1st check: element is visible and direction matches (or undefined)
			if (mark.element.offsetParent !== null && (!markDirection || markDirection === direction)) {
				const triggerPoint = mark.triggerPoint;
				const wasBefore = previousScroll < triggerPoint;
				const isAfter = triggerPoint <= currentScroll;
				// 2nd check: element actually crossed the mark
				if (wasBefore === isAfter) {
					// mark should be triggered
					queue.push(mark);
				}
			}
		});
		triggerQueue();
		previousScroll = currentScroll;
	}

	/**
	 * Trigger scrollmarks
	 */
	function triggerQueue () {
		// trigger marks in order
		queue.sort((a,b) => direction === 'down' ? a - b : b - a);
		queue.forEach((mark) => {
			mark.callback(mark.element, direction)
			if (mark.once) {
				scrollMarks.delete(mark.key);
			}
		});
		// reset queue
		queue = [];
	}

	/**
	 * Set the resized flag
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
			const height = documentElement.offsetHeight;
			if (previousHeight !== height) {
				updateOffsets();
				previousHeight = height;
			}
			resizeTick = 0;
		} else if (resized) {
			updateOffsets();
			resized = false;
			resizeTick = 0;
		} else {
			resizeTick++;
		}
		heightChecker = window.requestAnimationFrame(checkDocumentHeight);
	}

	/**
	 * Update all offsets
	 */
	function updateOffsets () {
		scrollMarks.forEach((mark) => mark.triggerPoint = typeof offset === 'function' ? mark.offset(mark.element) : mark.element.offsetTop - mark.offset);
	}

	/**
	 * FOR DEBUGGING
	 * Get a scrollmark by index
	 * @param {Number} index
	 * @return {Object} scrollmark
	 */
	function get(index) {
		return scrollMarks.get(index);
	}

	/**
	 * Set options
	 * @param {Object} options 
	 */
	function config(options) {
		scrollThrottle = options.throttle;
	}

	return {add, remove, start, stop, get, config};
}));
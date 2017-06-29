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

// listener for scroll events
let scrollListener;

// listener for resize events
let resizeListener;

let heightChecker;

// scroll direction
let direction;

// queue for triggered marks
let queue = [];

// let scrolled = false;

let resized = false;

let listenerProperties = false;

window.addEventListener("test", null, {
	get passive() {
		listenerProperties = {
			passive: true
		}
	}
});

// todo check scroll position and trigger handlers IN ORDER!!


function add (params) {
	// todo validate params
	// element, callback, once
	const key = index++;
	params.triggerPoint = typeof offset === 'function' ? params.offset(params.element) : params.element.offsetTop - params.offset;
	params.key = key;
	scrollMarks.set(key, params);
	if (!started) {
		//start();
	}
	return key;
	// todo trigger if already passed?
}

function remove () {
	scrollMarks.delete(key);
	if (!scrollMarks.size) {
		stop();
	}
}

function start () {
	started = true;
	scrollListener = window.addEventListener('scroll', onScroll, listenerProperties);
	resizeListener = window.addEventListener('resize', onResize, listenerProperties);
	heightChecker = window.requestAnimationFrame(checkDocumentHeight);
	checkMarks();
}

function stop () {
	started = false;
	// todo stop listening
	window.removeEventListener('scroll', scrollListener);
	window.removeEventListener('resize', resizeListener);
	window.cancelAnimationFrame(heightChecker);
}

function onScroll () {
	if (scrollTick === scrollThrottle) {
		scrollTick = 0;
		window.requestAnimationFrame(checkMarks);
	} else {
		scrollTick++;
	}
}

function checkMarks () {
	const currentScroll = window.pageYOffset;
	direction = previousScroll < currentScroll ? 'down' : 'up';
	scrollMarks.forEach((mark) => {
		const markDirection = mark.direction;
		// if it wasn't triggered yet and the direction matches and if it's visible (offsetParent !== null)
		if (mark.element.offsetParent !== null && (!markDirection || markDirection === direction)) {
			const triggerPoint = mark.triggerPoint;
			const wasBefore = previousScroll < triggerPoint;
			const isAfter = triggerPoint <= currentScroll;
			if (wasBefore === isAfter) {
				queue.push(mark);
			}
		}
	});
	triggerQueue();
	previousScroll = currentScroll;
}

function triggerQueue () {
	queue.sort((a,b) => direction === 'down' ? a - b : b - a);
	queue.forEach((mark) => {
		mark.callback(mark.element, direction)
		if (mark.once) {
			scrollMarks.delete(mark.key);
		}
	});
	queue = [];
}

function onResize () {
	resized = true;
}

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

function updateOffsets () {
	scrollMarks.forEach((mark) => mark.triggerPoint = typeof offset === 'function' ? mark.offset(mark.element) : mark.element.offsetTop - mark.offset);
}

function get(id) {
	return scrollMarks.get(id);
}

function config(options) {
	scrollThrottle = options.throttle;
}
return {add, remove, start, stop, get, config};
}));
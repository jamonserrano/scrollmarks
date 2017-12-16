# Scrollmarks

Scrollmarks is a compact library that calls a function when you scroll to an element.

[![Build Status](https://travis-ci.org/jamonserrano/scrollmarks.svg?branch=master)](https://travis-ci.org/jamonserrano/scrollmarks)
[![Coverage Status](https://coveralls.io/repos/github/jamonserrano/scrollmarks/badge.svg?branch=master)](https://coveralls.io/github/jamonserrano/scrollmarks?branch=master)

[![Build Status](https://saucelabs.com/browser-matrix/jamonserrano-scrollmarks.svg)](https://saucelabs.com/open_sauce/user/jamonserrano-scrollmarks)

## About

Scrollmarks is inspired by the awesome [Waypoints](http://imakewebthings.com/waypoints/) library. It aims to do less, add some missing features, and provide more speed by leveraging modern browser APIs. The most important features:

* Handles resize events and document height changes
* Only handles vertical scrolling of the whole document
* Customizable responsiveness and performance
* [Fast](https://jsperf.com/scrollmarks-vs-waypoints-init) and small (10.1KB, 2.3KB minified & gzipped)
* Light on browser resources
* Only supports evergreen browsers and IE10+

## Installation
Install with npm or yarn:

```sh
# npm
$ npm install scrollmarks --save

# yarn
$ yarn add scrollmarks
```

Or download the [latest release](https://github.com/jamonserrano/scrollmarks/releases/latest) from GitHub.

## Usage

### Add a scrollmark

```js
Scrollmarks.add({
	element: document.querySelector('.my-element'),
	callback: () => console.log('The element reached the top!')
});
```

The callback function will be executed when the top of the element reaches the top of the viewport.

### Callbacks
The callback function receives two parameters: the scroll direction (`'up'` or `'down'`) and the mark that triggered it.

```js
callback: (direction, mark) => console.log(`The user was scrolling ${direction}`)
```

> Instead of bounding the callback to the element, the mark is passed as a parameter so you can inspect and use its properties.

Callbacks can be removed after the first run by adding the `once: true` parameter.

### Offsets

You can modify the point where the callback is triggered by specifying an offset.

##### Number of pixels
`offset: 20` Moves the trigger point to 20 pixels down from the top of the viewport.

##### Pixel value
`offset: '-20px'` Moves the trigger point 20 pixels up from the top of the viewport.

##### Percentage of the viewport height
`offset: '20%'` Moves the trigger point down with 20% of the viewport height.

##### Function
`offset: (element) => window.innerHeight - element.offsetHeight` Triggers when the bottom of the element enters or leaves the viewport (by subtracting the element height from the viewport height).

### Direction
If you want to restrict the callback to one direction, use the `direction` parameter with a value of `'up'` or `'down'`.

```js
Scrollmarks.add({
	element: document.querySelector('.my-element'),
	direction: 'up',
	callback: () => {} // only called when scrolling up
});
```

## Advanced configuration

Scrollmarks' performance can be configured to fit the requirements of your application. See [`Scrollmarks.config()`](#scrollmarksconfigparameters)


## API

### Scrollmarks.add({parameters})
Adds a new scrollmark and starts watching. Returns an id that can be used to refresh or remove the mark.

```js
const markId = Scrollmarks.add({
	element: document.querySelector('.contact-form'),
	callback: () => alert('Scrolled down to the contact form!'),
	offset: '100%'
	direction: 'down',
	once: true,
	debug: true
});
// returns 4
```

#### Parameters:

##### `element` (HTMLElement, required)
The HTML element to watch.

##### `callback` (Function, required)
The function that is called when the top of the element reaches the top of the viewport.

Two parameters are passed to the function: the scroll direction ('up' or 'down') and the scrollmark object.

##### `offset` (number, string, or function)
Moves the trigger point from the top of the viewport. The offset can be a number (`20`), pixels (`'20px'`), a percentage of the viewport height (`'20%'`), or a function that returns a number. A positive offset moves the trigger point down, a negative up.

##### `direction` ('up' or 'down')
If set, the callback will only be executed when the page is scrolled in the given direction.

##### `once` (boolean)
If set, the callback will be executed at most once.

##### `debug` (boolean)
Shows the calculated trigger point on the page.


### Scrollmarks.remove(id)

Removes the scrollmark with the given id. If there are no marks left, stops watching. Returns `true` if the mark was found and removed, `false` if it didn't exist in the first place.

```js
Scrollmarks.remove(markId);
```

#### Parameter:

##### `id` (number)
The id of the mark.


### Scrollmarks.refresh(id)

If an element's position has changed you might need to refresh its mark.

```js
Scrollmarks.refresh(markId);
```

Calling refresh without an id refreshes all marks.

```js
Scrollmarks.refresh();
```

> Marks are refreshed when the height of the page changes (because elements were added, removed or modified). You should only resort to manual refresh in a few cases e.g. when an absolute positioned element moves around the page.

#### Parameter:

##### `id` (number)
The id of the mark.


### Scrollmarks.stop()
Stops watching. No callbacks will be triggered.

```js
Scrollmarks.stop();
```

> Although Scrollmarks stops automatically when there are no elements to watch, you might want to stop it manually.


### Scrollmarks.start()
Starts watching.

```js
Scrollmarks.start();
```

> Manual restarting is only required if haven't added any marks since calling `Scrollmarks.stop()`.

### Scrollmarks.config({parameters})

Sets or gets configuration parameters. When called with a parameters object sets the configuration. When called without parameters returns the configuration.

```js
Scrollmarks.config({
	scrollThrottle: 60,
	resizeThrottle: 300,
	idleTimeout: 100
});

Scrollmarks.config(); // returns the configuration
```

#### Parameters:

##### `scrollThrottle` (number)
Sets the number of frames between checking the scroll position of the page. The default value is 10, so six checks will be performed every second on most devices.

Lower values provide more precision but may cause performance issues on some pages.

##### `resizeThrottle` (number)
Sets the number of frames between checking the size of the page. The default value is 30, so two checks will be performed every second on most devices.

Lower values provide more precision but may cause performance issues on some pages.

##### `idleTimeout` (number)
Sets the maximum delay of refresh calls in milliseconds. The default value is 100.

A higher value can increase performance on pages that have a lot going on. Setting `idleTimeout` to 0 provides instant refresh.

> This parameter only affects [browsers that support `requestIdleCallback`](https://caniuse.com/requestidlecallback) . Older browsers will always use a zero timeout to defer refresh.

## License

MIT License
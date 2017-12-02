(function () {
	// Trigger scroll event after scrolling
	window.scrollWithEvent = function (y) {
		window.scrollTo(0, y);
		window.dispatchEvent(new CustomEvent('scroll'));
	}
	
	// IE Polyfill for CustomEvent
	// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill	
	if ( typeof window.CustomEvent === "function" ) return false;

	function CustomEvent ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;

	window.CustomEvent = CustomEvent;

})();
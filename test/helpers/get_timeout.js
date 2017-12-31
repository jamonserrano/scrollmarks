(function () {
	// var isIosSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent);
	window.getTimeout = function (type) {
		// Theoretically delaying with 1 frame should be enough (and it is in Chrome Headless)
		// but there are sporadic failures in Edge and FF so we add some leeway
		return Math.ceil((Scrollmarks.config()[(type || 'scroll') + 'Throttle'] + 5) / 60 * 1000);
	}
})();
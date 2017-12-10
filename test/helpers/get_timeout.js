(function () {
	// var isIosSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent);
	window.getTimeout = function (type) {
		return Math.ceil((Scrollmarks.config()[(type || 'scroll') + 'Throttle'] + 2) / 60 * 1000);
	}
})();
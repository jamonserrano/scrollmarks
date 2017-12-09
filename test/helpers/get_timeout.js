(function () {
	// var isIosSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent);
	window.getTimeout = function () {
		return Math.ceil((Scrollmarks.config().scrollThrottle + 10) / 60 * 1000);
	}
})();
(function () {
	var isIosSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent);
	window.getTimeout = function (delay) {
		return Math.ceil((Scrollmarks.config().scrollThrottle + (delay || 1)) / (isIosSafari ? 33 : 60) * 1000);
	}
})();
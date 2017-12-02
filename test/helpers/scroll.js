window.scrollWithEvent = function (y) {
	window.scrollTo(0, y);
	window.dispatchEvent(new Event('scroll'));
}
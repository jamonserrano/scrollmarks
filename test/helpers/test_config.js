
var testConfig = {
	scrollmarks: {
		scrollThrottle: 2,
		resizeThrottle: 2,
		idleTimeout: 0
	},
	bodyHeight: '2000px'
};

Scrollmarks.config(testConfig.scrollmarks);
document.body.style.height = testConfig.bodyHeight;
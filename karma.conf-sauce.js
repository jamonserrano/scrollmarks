// Karma configuration
// Generated on Fri Feb 19 2016 14:19:20 GMT+0100 (CET)

module.exports = function(config) {
	var customLaunchers = {
		sl_chrome_previous: {
			base: 'SauceLabs',
			browserName: 'chrome',
			version: 'latest-1'
		},
		sl_firefox_previous: {
			base: 'SauceLabs',
			browserName: 'firefox',
			version: 'latest-1'
		},
		sl_edge_previous: {
			base: 'SauceLabs',
      		browserName: 'microsoftedge',
      		platform: 'Windows 10',
      		version: 'latest-1'
		},
		sl_safari_previous: {
			base: 'SauceLabs',
			browserName: 'safari',
			platform: 'macOS 10.12',
			version: 'latest-1'
		},
		sl_ie_11: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '11.0'
		},
		sl_ie_10: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '10.0'
		}
	}
  
	config.set({
  
		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',
  
  
		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['mocha', 'fixture', 'sinon-chai', 'chai-dom', 'chai', 'calling'],
	  
  
		// list of files / patterns to load in the browser
		files: [
			'dist/scrollmarks.js',
			'test/helpers/test_config.js',
			'test/*.spec.js',
			'test/fixtures/**/*'
		],
	
		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'dist/scrollmarks.js': ['eslint', 'coverage'],
			'**/*.html': ['html2js']
		},
  
  
		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['dots', 'saucelabs', 'coverage', 'coveralls'],
	  
		coverageReporter: {
			type : 'lcov',
			dir: 'coverage/'
		},
  
		// web server port
		port: 9876,
  
  
		// enable / disable colors in the output (reporters and logs)
		colors: true,
  
  
		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,
  
		sauceLabs: {
			build: 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')',
			startConnect: true,
			tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
		},
  
		customLaunchers: customLaunchers,
  
		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: Object.keys(customLaunchers),
  
  
		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true,
  
		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: 4
	})
}
describe('ScrollMarks.config()', function () {
	it('should return the config when called without params', function () {
		var result = ScrollMarks.config();
		result.scrollThrottle.should.be.a('number');
		result.resizeThrottle.should.be.a('number');
		result.idleTimeout.should.be.a('number');
	});

	it('should set the config when called with params', function () {
		var defaultConfig = ScrollMarks.config();
		var expected = {
			scrollThrottle: 999,
			resizeThrottle: 888,
			idleTimeout: 777
		},
		result;

		ScrollMarks.config(expected);
		result = ScrollMarks.config();
		result.scrollThrottle.should.equal(expected.scrollThrottle);
		result.resizeThrottle.should.equal(expected.resizeThrottle);
		result.idleTimeout.should.equal(expected.idleTimeout);

		ScrollMarks.config(defaultConfig);
	});

	it('should not accept invalid params', function () {
		calling(ScrollMarks.config).with({scrollThrottle: -1}).should.throw();
		calling(ScrollMarks.config).with({resizeThrottle: -1}).should.throw();
		calling(ScrollMarks.config).with({idleTimeout: -1}).should.throw();

		calling(ScrollMarks.config).with({scrollThrottle: "a"}).should.throw();
		calling(ScrollMarks.config).with({resizeThrottle: "a"}).should.throw();
		calling(ScrollMarks.config).with({idleTimeout: "a"}).should.throw();
	})
});
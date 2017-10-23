describe('Scrollmarks.config()', function () {
	it('should return the config when called without params', function () {
		var result = Scrollmarks.config();
		result.scrollThrottle.should.be.a('number');
		result.resizeThrottle.should.be.a('number');
		result.idleTimeout.should.be.a('number');
	});

	it('should set the config when called with params', function () {
		var defaultConfig = Scrollmarks.config();
		var expected = {
			scrollThrottle: 999,
			resizeThrottle: 888,
			idleTimeout: 777
		},
		result;

		Scrollmarks.config(expected);
		result = Scrollmarks.config();
		result.scrollThrottle.should.equal(expected.scrollThrottle);
		result.resizeThrottle.should.equal(expected.resizeThrottle);
		result.idleTimeout.should.equal(expected.idleTimeout);

		Scrollmarks.config(defaultConfig);
	});

	it('should not accept invalid params', function () {
		calling(Scrollmarks.config).with({ hello: 0 }).should.throw(ReferenceError);
	});

	it('should not accept invalid values', function () {
		calling(Scrollmarks.config).with({ scrollThrottle: 0 }).should.throw(RangeError);
		calling(Scrollmarks.config).with({ resizeThrottle: 0 }).should.throw(RangeError);
		calling(Scrollmarks.config).with({ idleTimeout: -1 }).should.throw(RangeError);

		calling(Scrollmarks.config).with({ scrollThrottle: "a" }).should.throw(TypeError);
		calling(Scrollmarks.config).with({ resizeThrottle: "a" }).should.throw(TypeError);
		calling(Scrollmarks.config).with({ idleTimeout: "a" }).should.throw(TypeError);
	});
});
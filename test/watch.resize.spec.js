describe('Resize watching', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
	});

	after(function () {
		fixture.cleanup();
	});

	it('should recalculate offsets when the document is resized', function (done) {
		var offset = sinon.spy(function () {
			return 0;
		});

		var mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: function () {},
			offset: offset
		});

		offset.reset();
		window.dispatchEvent(new CustomEvent('resize'));
		
		// not called straight away
		offset.should.not.have.been.called;
		
		// only after the timeout set by config.resizeThrottle
		setTimeout(function () {
			offset.should.have.been.called;
			Scrollmarks.remove(mark);
			done();
		}, getTimeout('resize'));
	});
})
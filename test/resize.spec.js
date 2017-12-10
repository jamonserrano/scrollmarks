describe('Resize watching', function () {
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
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

		var offsetCalls = offset.callCount;
		window.dispatchEvent(new CustomEvent('resize'));
		
		// not called straight away
		offset.should.have.callCount(offsetCalls);
		// only after the timeout set by config.resizeThrottle
		setTimeout(function () {
			offset.should.have.callCount(offsetCalls + 1);
			Scrollmarks.remove(mark);
			done();
		}, getTimeout('resize'));
	});
})
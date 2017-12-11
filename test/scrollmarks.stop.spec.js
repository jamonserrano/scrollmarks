describe('Scrollmarks.stop()', function () {
	
	before(function () {
		fixture.setBase('test/fixtures');
		fixture.load('static_position.html');
	});

	after(function () {
		fixture.cleanup();
	});

	it('should exist', function () {
		Scrollmarks.stop.should.be.a('function');
	});

	it('should stop listening', function (done) {
		var callback = sinon.spy();
		var mark;

		Scrollmarks.start();
		mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: callback
		});
		
		window.scrollWithEvent(100);

		setTimeout(function () {
			Scrollmarks.stop();
			window.scrollWithEvent(0);
			setTimeout(function () {
				callback.should.have.been.calledOnce;
				Scrollmarks.remove(mark);
				done();
			}, getTimeout());
		}, getTimeout());
	});
});
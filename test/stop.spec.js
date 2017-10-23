describe('Scrollmarks.stop()', function () {
	it('should exist', function () {
		Scrollmarks.stop.should.be.a('function');
	});

	it('should stop listening', function (done) {
		var element = document.getElementById('static');
		var callback = sinon.spy();
		var timeout = (Scrollmarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
		var mark;

		Scrollmarks.start();
		mark = Scrollmarks.add({element: element, callback: callback});
		
		window.scrollTo(0, 100);
		Scrollmarks.stop();
		window.scrollTo(0, 0);

		setTimeout(function () {
			callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark);
			done();
		}, timeout);
	});
});
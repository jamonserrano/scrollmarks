describe('ScrollMarks.stop()', function () {
	it('should exist', function () {
		ScrollMarks.stop.should.be.a('function');
	});

	it('should stop listening', function (done) {
		var element = document.getElementById('static');
		var callback = sinon.spy();
		var timeout = (ScrollMarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
		
		ScrollMarks.start();
		ScrollMarks.add({element: element, callback: callback});
		
		window.scrollTo(0, 100);
		ScrollMarks.stop();
		window.scrollTo(0, 0);

		setTimeout(function () {
			callback.should.have.been.calledOnce;
			done();
		}, timeout);
	});
});
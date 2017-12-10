describe('Once parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
	});

	after(function () {
		fixture.cleanup();
	});

	it('should remove the mark after the callback is called', function (done) {
		window.scrollTo(0, 0);
		
		var callback = sinon.spy();		
		var mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: callback,
			once: true
		});
		
		window.scrollWithEvent(100);

		setTimeout(function () {
			callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark).should.be.false;
			done();
		}, getTimeout());
	});
});
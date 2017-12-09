describe('Scrollmarks.stop()', function () {
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.callback = sinon.spy();
		this.params = {
			element: this.element,
			callback: this.callback
		};
	});

	
	it('should exist', function () {
		Scrollmarks.stop.should.be.a('function');
	});

	it('should stop listening', function (done) {
		var mark;

		Scrollmarks.start();
		mark = Scrollmarks.add(this.params);
		
		window.scrollWithEvent(100);
		Scrollmarks.stop();
		window.scrollWithEvent(0);

		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark);
			done();
		}.bind(this), getTimeout());
	});
});
describe('Once parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.callback = sinon.spy();
		this.timeout = (ScrollMarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
		this.params = {
			element: this.element,
			callback: this.callback,
			once: true
		};
	});

	afterEach(function () {
		this.callback.reset();
	});

	it('should remove the mark after the callback is called', function (done) {
		var mark = ScrollMarks.add(this.params);
		window.scrollTo(0, 100);

		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			ScrollMarks.remove(mark).should.be.false;
			done();
		}.bind(this), this.timeout);
	});
});
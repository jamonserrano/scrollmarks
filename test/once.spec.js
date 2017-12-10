describe('Once parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		
		this.element = document.getElementById('static');
		
		this.callback = sinon.spy();
		this.params = {
			element: this.element,
			callback: this.callback,
			once: true
		};

		window.scrollTo(0, 0);
	});

	after(function () {
		fixture.cleanup();
	});

	afterEach(function () {
		this.callback.reset();
	});

	it('should remove the mark after the callback is called', function (done) {
		var mark = Scrollmarks.add(this.params);
		window.scrollWithEvent(100);

		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark).should.be.false;
			done();
		}.bind(this), getTimeout());
	});
});
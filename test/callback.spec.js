describe('Callback parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.callback = sinon.spy();
		this.timeout = (Scrollmarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
		this.params = {
			element: this.element,
			callback: this.callback
		};
	});

	after(function () {
		fixture.cleanup();
	});

	it('should receive the direction and the mark as parameters', function (done) {
		window.scrollTo(0, 0);
		var mark = Scrollmarks.add(this.params);
		window.scrollWithEvent(100);

		setTimeout(function () {
			this.callback.args[0].length.should.equal(2);
			this.callback.args[0][0].should.equal('down');
			this.callback.args[0][1].key.should.equal(mark);
			Scrollmarks.remove(mark);
			done();
		}.bind(this), this.timeout);
	});
});
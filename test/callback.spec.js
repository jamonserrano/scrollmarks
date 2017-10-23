describe('Callback parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.callback = sinon.spy();
		this.timeout = (ScrollMarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
		this.params = {
			element: this.element,
			callback: this.callback
		};
	});

	it('should receive the direction and the mark as parameters', function (done) {
		var mark = ScrollMarks.add(this.params);
		window.scrollTo(0, 100);

		setTimeout(function () {
			this.callback.args[0].length.should.equal(2);
			this.callback.args[0][0].should.equal('down');
			this.callback.args[0][1].key.should.equal(mark);
			done();
		}.bind(this), this.timeout);
	});
});
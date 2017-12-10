describe('Height watching', function () {

	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");

		this.offset = sinon.spy(function () {
			return 0;
		});

		this.mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: function () {},
			offset: this.offset
		});
	});

	after(function () {
		fixture.cleanup();
	});

	it('should recalculate offset when document height changes', function (done) {
		var offsetCalls = this.offset.callCount;
		document.body.style.height = '100px';

		setTimeout(function () {
			this.offset.should.have.callCount(offsetCalls + 1);
			Scrollmarks.remove(this.mark);
			document.body.style.height = testConfig.bodyHeight;
			done();
		}.bind(this), getTimeout('resize'));
	});
});
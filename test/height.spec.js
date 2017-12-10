describe('Height watching', function () {

	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
	});

	after(function () {
		fixture.cleanup();
	});

	it('should recalculate offset when document height changes', function (done) {
		var offset = sinon.spy(function () {
			return 0;
		});

		var mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: function () {},
			offset: offset
		});


		var offsetCalls = offset.callCount;
		document.body.style.height = '100px';

		setTimeout(function () {
			offset.should.have.callCount(offsetCalls + 1);
			Scrollmarks.remove(mark);
			document.body.style.height = testConfig.bodyHeight;
			done();
		}, getTimeout('resize'));
	});
});
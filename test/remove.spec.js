describe('Scrollmarks.remove()', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
	});

	after(function () {
		fixture.cleanup();
	});

	it('should exist', function () {
		Scrollmarks.remove.should.be.a('function');
	});

	it('should return true on success', function () {
		var mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: function () {}
		});
		Scrollmarks.remove(mark).should.be.true;
	});

	it('should return false on a nonexistent mark', function () {
		Scrollmarks.remove(98766).should.be.false;
	});

	it('should return false on an undefined mark', function () {
		Scrollmarks.remove().should.be.false;
	});
	
});
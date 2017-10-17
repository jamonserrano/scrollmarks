describe('ScrollMarks.remove()', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
	});

	it('should exist', function () {
		ScrollMarks.remove.should.be.a('function');
	});

	it('should return true on success', function () {
		var mark = ScrollMarks.add({
			element: document.getElementById('static'),
			callback: function () {}
		});
		ScrollMarks.remove(mark).should.be.true;
	});

	it('should return false on a nonexistent mark', function () {
		ScrollMarks.remove(98766).should.be.false;
	});

	it('should return false on an undefined mark', function () {
		ScrollMarks.remove().should.be.false;
	});
	
});
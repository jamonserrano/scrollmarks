describe('ScrollMarks.remove()', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
	});

	it('should exist', function () {
		ScrollMarks.remove.should.be.a('function');
	});

	it('should remove the mark', function () {
		var mark = ScrollMarks.add({
			element: document.getElementById('static'),
			callback: function () {}
		});
		calling(ScrollMarks.remove).with(mark).should.not.throw();
	});

	it('should throw error on nonexistent mark', function () {
		calling(ScrollMarks.remove).with(98766).should.throw(ReferenceError);
	});

	it('should throw error on undefined mark', function () {
		calling(ScrollMarks.remove).should.throw(ReferenceError);
	});
	
});
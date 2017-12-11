describe('Element parameter', function () {

	before(function () {
		fixture.setBase('test/fixtures');
		fixture.load('static_position.html');
	});

	after(function () {
		fixture.cleanup();
	});
		
	it('should be mandatory', function () {
		calling(Scrollmarks.add).with({
			callback: function () {}
		}).should.throw(TypeError);
	});

	it('should accept an HTML Element', function () {
		var mark;
		calling(function() {
			mark = Scrollmarks.add({
				element: document.getElementById('static'),
				callback: function () {}
			});
		}).should.not.throw();
		Scrollmarks.remove(mark);
	});
	
	it('should not accept other values', function () {
		calling(Scrollmarks.add).with({ element: 'a', callback: this.emptyCallback }).should.throw(TypeError);
	});
});
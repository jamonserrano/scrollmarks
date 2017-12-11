describe('Debug parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");

		this.element = document.getElementById('static');
		this.callback = function () {};
	});

	after(function () {
		fixture.cleanup();
	});
	
	it('should accept a boolean', function () {
		var mark;
		var params = {
			element: this.element,
			callback: this.callback,
			debug: true
		};
		
		calling(function() {
			mark = Scrollmarks.add(params);
		}).should.not.throw();
		Scrollmarks.remove(mark);

		params.debug = false;	
		
		calling(function() {
			mark = Scrollmarks.add(params);
		}).should.not.throw();
		Scrollmarks.remove(mark);
	});

	it('should not accept something else', function () {
		var params = {
			element: this.element,
			callback: this.callback,
			debug: 'true'
		};
		
		calling(Scrollmarks.add).with(params).should.throw();
	});
});

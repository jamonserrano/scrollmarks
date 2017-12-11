describe('Callback parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		
		this.element = document.getElementById('static');
	});

	after(function () {
		fixture.cleanup();
	});

	it('should be mandatory', function () {
		calling(Scrollmarks.add).with({
			element: this.element
		}).should.throw(TypeError);
	});

	it('should accept a function', function () {
		var mark;
		var params = {
			element: this.element,
			callback: function () {}
		};
		
		calling(function() {
			mark = Scrollmarks.add(params);
		}).should.not.throw();
		
		Scrollmarks.remove(mark);
	});
	
	it('should not accept other values', function () {
		calling(Scrollmarks.add).with({
			element: this.element,
			callback: "a"
		}).should.throw(TypeError);
	});

	it('should receive the direction and the mark as parameters', function (done) {
		window.scrollTo(0, 0);
		
		var callback = sinon.spy();		
		var mark = Scrollmarks.add({
			element: this.element,
			callback: callback
		});

		window.scrollWithEvent(100);

		setTimeout(function () {
			callback.should.have.been.called;
			callback.args[0].length.should.equal(2);
			callback.args[0][0].should.equal('down');
			callback.args[0][1].key.should.equal(mark);
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});
});
describe('Scrolling', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("multiple_elements.html");

		this.el1 = document.getElementById('el1');
		this.el2 = document.getElementById('el2');
	});

	after(function () {
		fixture.cleanup();
	});

	it('should trigger marks from top to bottom when scrolling down', function (done) {
		var callback1 = sinon.spy(function () {
			callback2.should.not.have.been.called;
		});

		var callback2 = sinon.spy(function () {
			callback1.should.have.been.called;
		});

		var mark1 = Scrollmarks.add({
			element: this.el1,
			callback: callback1
		});

		var mark2 = Scrollmarks.add({
			element: this.el2,
			callback: callback2
		});

		scrollWithEvent(200);
		
		setTimeout(function () {
			callback2.should.have.been.called;
			Scrollmarks.remove(mark1);
			Scrollmarks.remove(mark2);
			done();
		}, getTimeout());
	});

	it('should trigger marks from top to bottom when scrolling down', function (done) {
		var initialized = false;
		scrollTo(0, 200);
		
		var callback1 = sinon.spy(function () {
			if (initialized) {
				callback2.should.have.been.called;
			}
		});
		
		var callback2 = sinon.spy(function () {
			if (initialized) {
				callback1.should.not.have.been.called;
			}
		});

		var mark1 = Scrollmarks.add({
			element: this.el1,
			callback: callback1
		});

		var mark2 = Scrollmarks.add({
			element: this.el2,
			callback: callback2
		});

		// callbacks are triggered when adding because of the scroll position, so we reset them
		callback1.reset();
		callback2.reset();
		initialized = true;

		scrollWithEvent(0);
		
		setTimeout(function () {
			callback1.should.have.been.called;
			Scrollmarks.remove(mark1);
			Scrollmarks.remove(mark2);
			done();
		}, getTimeout());
	});
});
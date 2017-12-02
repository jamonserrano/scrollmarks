describe('Direction parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.timeout = (Scrollmarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
	});

	after(function () {
		fixture.cleanup();
	});

	beforeEach(function () {
		this.callback = sinon.spy();
	});

	afterEach(function () {
		Scrollmarks.stop();
	});

	it('should trigger in both directions when param is missing', function (done) {
		var mark = Scrollmarks.add({
			element: this.element,
			callback: this.callback
		});
		window.scrollWithEvent(100);
		window.scrollWithEvent(0);

		setTimeout(function () {
			this.callback.should.have.been.calledTwice;
			Scrollmarks.remove(mark);
			done();
		}.bind(this), this.timeout);
	});

	it('should not trigger when direction is \'up\' and scrolling down', function (done) {
		var mark = Scrollmarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'up'
		});
		window.scrollWithEvent(100);

		setTimeout(function () {
			this.callback.should.not.have.been.called;
			Scrollmarks.remove(mark);
			window.scrollWithEvent(0);
			done();
		}.bind(this), this.timeout);
	});

	it('should trigger when direction is \'up\' and scrolling up', function (done) {
		window.scrollTo(0, 100);
		var mark = Scrollmarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'up'
		});

		window.scrollWithEvent(0);
		
		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark);
			done();
		}.bind(this), this.timeout);
	});

	it('should trigger when direction is \'down\' and scrolling down', function (done) {
		window.scrollTo(0, 0);
		var mark = Scrollmarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'down'
		});
		
		window.scrollWithEvent(100);
		
		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark);
			window.scrollTo(0, 0);
			done();
		}.bind(this), this.timeout);
	});

	it('should not trigger when direction is \'down\' and scrolling up', function (done) {
		window.scrollTo(0, 100);

		var mark = Scrollmarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'down'
		});

		// it should be called once as the page is scrolled down when the mark is added
		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			this.callback.reset();
			window.scrollWithEvent(0);
			setTimeout(function () {
				// but it should not be called when we scroll up
				this.callback.should.not.have.been.called;
				Scrollmarks.remove(mark);
				done();
			}.bind(this), this.timeout);
		}.bind(this), this.timeout);
	});
});
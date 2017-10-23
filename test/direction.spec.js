describe('ScrollMarks.add()', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.callback = sinon.spy();
		this.timeout = (ScrollMarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
		this.params = {
			element: this.element,
			callback: this.callback
		};
	});

	afterEach(function () {
		this.callback.reset();
	});

	it('should trigger in both directions when param is missing', function (done) {
		var mark = ScrollMarks.add(this.params);
		window.scrollTo(0, 100);
		window.scrollTo(0, 0);

		setTimeout(function () {
			this.callback.should.have.been.calledTwice;
			ScrollMarks.remove(mark);
			done();
		}.bind(this), this.timeout);
	});

	it('should not trigger when direction is \'up\' and scrolling down', function (done) {
		var mark = ScrollMarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'up'
		});
		window.scrollTo(0, 100);

		setTimeout(function () {
			this.callback.should.not.have.been.called;
			ScrollMarks.remove(mark);
			window.scrollTo(0, 0);
			done();
		}.bind(this), this.timeout);
	});

	it('should trigger when direction is \'up\' and scrolling up', function (done) {
		window.scrollTo(0, 100);
		var mark = ScrollMarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'up'
		});

		window.scrollTo(0, 0);
		
		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			ScrollMarks.remove(mark);
			done();
		}.bind(this), this.timeout);
	});

	it('should trigger when direction is \'down\' and scrolling down', function (done) {
		var mark = ScrollMarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'down'
		});
		
		window.scrollTo(0, 100);
		
		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			ScrollMarks.remove(mark);
			window.scrollTo(0, 0);
			done();
		}.bind(this), this.timeout);
	});

	it('should not trigger when direction is \'down\' and scrolling up', function (done) {
		window.scrollTo(0, 100);

		var mark = ScrollMarks.add({
			element: this.element,
			callback: this.callback,
			direction: 'down'
		});

		// it should be called once as the page is scrolled down when the mark is added
		setTimeout(function () {
			this.callback.should.have.been.calledOnce;
			this.callback.reset();
			window.scrollTo(0, 0);
			setTimeout(function () {
				// but it should not be called when we scroll up
				this.callback.should.not.have.been.called;
				ScrollMarks.remove(mark);
				done();
			}.bind(this), this.timeout);
		}.bind(this), this.timeout);
	});
});
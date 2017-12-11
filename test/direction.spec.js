describe('Direction parameter', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");

		this.element = document.getElementById('static');
		this.callback = function () {};
	});

	afterEach(function () {
		Scrollmarks.stop();
	});

	after(function () {
		fixture.cleanup();
	});	

	it('should accept \'up\'', function () {
		var params = {
			element: this.element,
			callback: this.callback,
			direction: 'up'
		};
		var mark;
		
		calling(function() {
			mark = Scrollmarks.add(params);
		}).should.not.throw();
		
		Scrollmarks.remove(mark);
	});

	it('should accept \'down\'', function () {
		var mark;
		var params = {
			element: this.element,
			callback: this.callback,
			direction: 'down'
		};
		
		calling(function() {
			mark = Scrollmarks.add(params);
		}).should.not.throw();
		
		Scrollmarks.remove(mark);
	});

	it('should not accept something else', function () {
		var params = {
			element: this.element,
			callback: this.callback,
			direction: true
		};
		
		calling(Scrollmarks.add).with(params).should.throw();

		params.direction = 'sideways';
		
		calling(Scrollmarks.add).with(params).should.throw();
	});


	it('should trigger in both directions when param is missing', function (done) {
		var callback = sinon.spy();
		var mark = Scrollmarks.add({
			element: this.element,
			callback: callback
		});

		window.scrollWithEvent(100);
		
		setTimeout(function () {
			window.scrollWithEvent(0);
			setTimeout(function () {
				callback.should.have.been.calledTwice;
				Scrollmarks.remove(mark);
				done();
			}, getTimeout());
		}, getTimeout());
	});

	it('should not trigger when direction is \'up\' and scrolling down', function (done) {
		var callback = sinon.spy();
		var mark = Scrollmarks.add({
			element: this.element,
			callback: callback,
			direction: 'up'
		});
		window.scrollWithEvent(100);

		setTimeout(function () {
			callback.should.not.have.been.called;
			Scrollmarks.remove(mark);
			window.scrollWithEvent(0);
			done();
		}, getTimeout());
	});

	it('should trigger when direction is \'up\' and scrolling up', function (done) {
		window.scrollTo(0, 100);
		var callback = sinon.spy();
		var mark = Scrollmarks.add({
			element: this.element,
			callback: callback,
			direction: 'up'
		});

		window.scrollWithEvent(0);
		
		setTimeout(function () {
			callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should trigger when direction is \'down\' and scrolling down', function (done) {
		window.scrollTo(0, 0);
		var callback = sinon.spy();
		var mark = Scrollmarks.add({
			element: this.element,
			callback: callback,
			direction: 'down'
		});
		
		window.scrollWithEvent(100);
		
		setTimeout(function () {
			callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark);
			window.scrollTo(0, 0);
			done();
		}, getTimeout());
	});

	it('should not trigger when direction is \'down\' and scrolling up', function (done) {
		window.scrollTo(0, 100);
		var callback = sinon.spy();
		var mark = Scrollmarks.add({
			element: this.element,
			callback: callback,
			direction: 'down'
		});

		// it should be called once as the page is scrolled down when the mark is added
		setTimeout(function () {
			callback.should.have.been.calledOnce;
			callback.reset();
			window.scrollWithEvent(0);
			setTimeout(function () {
				// but it should not be called when we scroll up
				callback.should.not.have.been.called;
				Scrollmarks.remove(mark);
				done();
			}, getTimeout());
		}, getTimeout());
	});
});
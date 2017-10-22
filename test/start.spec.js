describe('ScrollMarks.start()', function () {
	
	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.timeout = (ScrollMarks.config().scrollThrottle + 1) / 60 * 1000; // expected execution + 1 frame
		
		document.body.style.height = '200vh';
	});

	beforeEach(function () {
		ScrollMarks.stop();
		window.scrollTo(0, 0);
	})

	it('should exist', function () {
		ScrollMarks.start.should.be.a('function');
	});

	it('should start listening', function (done) {
		var callback = sinon.spy();
		var mark = ScrollMarks.add({element: this.element, callback: callback});
		
		ScrollMarks.stop();
		ScrollMarks.start();
		
		window.scrollTo(0, 100);

		setTimeout(function () {
			callback.should.have.been.calledOnce;
			ScrollMarks.remove(mark);
			done();
		}, this.timeout);
	});

	it('should trigger callback if element is passed and direction is not "up"', function (done) {
		var callback = sinon.spy();
		var downCallback = sinon.spy();
		var upCallback = sinon.spy();
		var marks = [];

		window.scrollTo(0,0);
		document.body.style.height = '200vh';
		marks.push(ScrollMarks.add({element: this.element, callback: callback}));
		marks.push(ScrollMarks.add({element: this.element, callback: downCallback, direction: "down"}));
		marks.push(ScrollMarks.add({element: this.element, callback: upCallback, direction: "up"}));
		ScrollMarks.stop();
		window.scrollTo(0,100);
		ScrollMarks.start();
		
		setTimeout(function () {
			callback.should.have.been.calledOnce;
			downCallback.should.have.been.calledOnce;
			upCallback.should.not.have.been.called;
			marks.forEach(function (mark) {
				ScrollMarks.remove(mark);
			})
			done();
		}, this.timeout);
	});

});
describe('Scrollmarks.add()', function () {

	before(function () {
		fixture.setBase('test/fixtures');
		fixture.load('static_position.html');
		
		this.element = document.getElementById('static');
	});

	beforeEach(function () {
		scrollTo(0, 0);
	});

	after(function () {
		fixture.cleanup();
	});
	
	it('should exist', function () {
		Scrollmarks.add.should.be.a('function');
	});

	it('should return a number', function () {
		var mark = Scrollmarks.add({ element: this.element, callback: function () {} });
		
		mark.should.be.a('number');
		
		Scrollmarks.remove(mark);
	});

	it('should start listening', function (done) {
		var mark;
		var callback = sinon.spy();
		
		Scrollmarks.stop();
		mark = Scrollmarks.add({element: this.element, callback: callback});
		scrollWithEvent(100);

		setTimeout(function () {
			callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should trigger callback if element is passed and direction is not \'up\'', function (done) {
		var callback = sinon.spy();
		var downCallback = sinon.spy();
		var upCallback = sinon.spy();
		var marks = [];
		var element = this.element;

		scrollWithEvent(100);
		// the first mark is checked in the regular loop
		marks.push(Scrollmarks.add({element: element, callback: callback}));
		
		setTimeout(function () {
			callback.should.have.been.calledOnce;
			// subsequent marks are checked out of the loop as soon as they are added
			marks.push(Scrollmarks.add({element: element, callback: downCallback, direction: 'down'}));
			marks.push(Scrollmarks.add({element: element, callback: upCallback, direction: 'up'}));	
			
			downCallback.should.have.been.calledOnce;
			upCallback.should.not.have.been.called;
			
			marks.forEach(function (mark) {
				Scrollmarks.remove(mark);
			});
			done();
		}, getTimeout());
	});
});
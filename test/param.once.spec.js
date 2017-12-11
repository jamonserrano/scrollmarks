describe('Once parameter', function () {
	
	before(function () {
		fixture.setBase('test/fixtures');
		fixture.load('static_position.html');

		this.element = document.getElementById('static');
		this.callback = function () {};
	});

	beforeEach(function () {
		scrollTo(0, 0);
	});

	after(function () {
		fixture.cleanup();
	});

	it('should accept a boolean', function () {
		var mark;
		var params = {
			element: this.element,
			callback: this.callback,
			once: true
		};
		
		calling(function() {
			mark = Scrollmarks.add(params);
		}).should.not.throw();
		Scrollmarks.remove(mark);
		
		params.once = false;
		
		calling(function() {
			mark = Scrollmarks.add(params);
		}).should.not.throw();
		Scrollmarks.remove(mark);
	});

	it('should not accept other values', function () {
		var params = {
			element: this.element,
			callback: this.callback,
			once: 'true'
		};
		
		calling(Scrollmarks.add).with(params).should.throw();
	});

	it('should remove the mark after the callback is called', function (done) {		
		var callback = sinon.spy();		
		var mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: callback,
			once: true
		});
		
		window.scrollWithEvent(100);

		setTimeout(function () {
			callback.should.have.been.calledOnce;
			Scrollmarks.remove(mark).should.be.false;
			done();
		}, getTimeout());
	});
});
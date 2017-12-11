describe('Idle callback', function () {
	
	before(function () {
		fixture.setBase('test/fixtures');
		fixture.load('static_position.html');

		this.offset = sinon.spy(function () {
			return 0;
		});
		this.mark = Scrollmarks.add({
			element: document.getElementById('static'),
			callback: function () {},
			offset: this.offset
		});
	});

	beforeEach(function () {
		this.offset.reset();
	});

	after(function () {
		Scrollmarks.remove(this.mark);
		Scrollmarks.config(testConfig.scrollmarks);
		fixture.cleanup();
	});

	it('should trigger the callback instantly when idleTimeout = 0', function () {
		Scrollmarks.config({ idleTimeout: 0});
		Scrollmarks.refresh(this.mark);
		
		this.offset.should.have.been.called;
	});

	it('should trigger the callback later when idleTimeout > 0', function (done) {
		var idleTimeout = 10;
		Scrollmarks.config({ idleTimeout: idleTimeout });
		Scrollmarks.refresh(this.mark);
		
		this.offset.should.not.have.been.called;
		
		setTimeout(function () {
			this.offset.should.have.been.called;
			done();
		}.bind(this), idleTimeout);
	});
});
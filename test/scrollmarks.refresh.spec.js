describe('Scrollmarks.refresh()', function () {
	
	before(function () {
		fixture.setBase('test/fixtures');
		fixture.load('multiple_elements.html');
		
		this.offset1 = sinon.spy(function () {
			return 20;
		});
		this.offset2 = sinon.spy(function () {
			return 20;
		});

		this.mark1 = Scrollmarks.add({
			element: document.getElementById('el1'),
			callback: function () {},
			offset: this.offset1
		});
		this.mark2 = Scrollmarks.add({
			element: document.getElementById('el2'),
			callback: function () {},
			offset: this.offset2
		});
	});

	beforeEach(function () {
		this.offset1.reset();
		this.offset2.reset();
	});

	after(function () {
		Scrollmarks.remove(this.mark1);
		Scrollmarks.remove(this.mark2);
		fixture.cleanup();
	});

	it('should refresh all marks when called without params', function () {
		Scrollmarks.refresh();
		
		this.offset1.should.have.been.calledOnce;
		this.offset2.should.have.been.calledOnce;
	});

	it('should refresh the mark received as a param', function () {
		Scrollmarks.refresh(this.mark1);
		
		this.offset1.should.have.been.calledOnce;
		this.offset2.should.not.have.been.called;
	});

	it('should throw an error when trying to refresh an invalid mark', function () {
		calling(Scrollmarks.refresh).with('hello').should.throw(ReferenceError);
	});
})
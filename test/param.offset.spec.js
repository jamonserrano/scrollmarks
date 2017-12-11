describe('Offset parameter', function () {

	before(function () {
		fixture.setBase('test/fixtures');
		fixture.load('static_position.html');
		
		this.element = document.getElementById('static');
		this.offsetTop = this.element.offsetTop;
	});

	beforeEach(function () {
		scrollTo(0, 0);
	});

	after(function () {
		fixture.cleanup();
	});

	it('default value should be 0', function (done) {
		var mark = Scrollmarks.add({
			element: this.element,
			callback: function (direction, mark) {
				mark.computedOffset.should.equal(0);
				mark.triggerPoint.should.equal(this.offsetTop);
			}.bind(this)
		});
		
		scrollWithEvent(this.offsetTop);

		setTimeout(function () {
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should accept and use a positive number', function (done) {
		var offset = 10;
		
		var mark = Scrollmarks.add({
			element: this.element,
			callback: function (direction, mark) {
				mark.computedOffset.should.equal(offset);
				mark.triggerPoint.should.equal(this.offsetTop - offset);
			}.bind(this),
			offset: offset
		});
		
		scrollWithEvent(this.offsetTop - offset);

		setTimeout(function () {
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should accept and use a negative number', function (done) {
		var offset = -10;
		
		var mark = Scrollmarks.add({
			element: this.element,
			callback: function (direction, mark) {
				mark.computedOffset.should.equal(offset);
				mark.triggerPoint.should.equal(this.offsetTop - offset);
			}.bind(this),
			offset: offset
		});
		
		scrollWithEvent(this.offsetTop - offset);

		setTimeout(function () {
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should accept and use a function', function (done) {
		var offset = 10;
		var functionOffset = function () {
			return offset;
		};
		
		var mark = Scrollmarks.add({
			element: this.element,
			callback: function (direction, mark) {
				mark.computedOffset().should.equal(offset);
				mark.triggerPoint.should.equal(this.offsetTop - offset);
			}.bind(this),
			offset: functionOffset
		});
		
		scrollWithEvent(this.offsetTop - offset);

		setTimeout(function () {
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should not accept a function that doesn\'t return a number', function () {
		calling(Scrollmarks.add).with({
			element: this.element,
			callback: function () {},
			offset: function () {}
		}).should.throw(TypeError);
	});

	it('should accept and use a \'px\' value', function (done) {
		var offset = 10;
		var pxOffset = offset + 'px';
		
		var mark = Scrollmarks.add({
			element: this.element,
			callback: function (direction, mark) {
				mark.computedOffset.should.equal(offset);
				mark.triggerPoint.should.equal(this.offsetTop - offset);
			}.bind(this),
			offset: pxOffset
		});
		
		scrollWithEvent(this.offsetTop - offset);

		setTimeout(function () {
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should accept use a \'%\' value', function (done) {
		var offset = 1;
		var percentOffset = offset + '%';
		var expectedOffset = window.innerHeight * offset / 100;
		
		var mark = Scrollmarks.add({
			element: this.element,
			callback: function (direction, mark) {
				mark.computedOffset().should.equal(expectedOffset);
				mark.triggerPoint.should.equal(this.offsetTop - expectedOffset);
			}.bind(this),
			offset: percentOffset
		});

		scrollWithEvent(this.offsetTop - expectedOffset);

		setTimeout(function () {
			Scrollmarks.remove(mark);
			done();
		}, getTimeout());
	});

	it('should not accept other values', function () {
		calling(Scrollmarks.add).with({
			element: this.element,
			callback: function () {},
			offset: true
		}).should.throw(TypeError);
	});
});
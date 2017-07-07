describe('ScrollMarks.add()', function () {

	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.callback = function () {};
		this.params = {
			element: this.element,
			callback: this.callback
		};
	});
	
	it('should exist', function () {
		ScrollMarks.add.should.be.a('function');
	});

	it('should return a number', function () {
		ScrollMarks.add({ element: this.element, callback: this.callback }).should.be.a('number');
	});
	
	describe('element parameter', function () {
		
		it('should be mandatory', function () {
			calling(ScrollMarks.add).with({ callback: this.callback }).should.throw(TypeError);
		});

		it('should accept an HTML Element', function () {
			calling(ScrollMarks.add).with(this.params).should.not.throw();
			calling(ScrollMarks.add).with({ element: "a", callback: this.callback }).should.throw(TypeError);
		});

	});

	describe('callback parameter', function () {
		
		it('should be mandatory', function () {
			calling(ScrollMarks.add).with({ element: this.element }).should.throw(TypeError);
		});

		it('should accept a function', function () {
			calling(ScrollMarks.add).with(this.params).should.not.throw();
			calling(ScrollMarks.add).with({ element: this.element, callback: "a" }).should.throw(TypeError);
		});

	});

	describe('offset parameter', function () {

		it('should accept a number', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				offset: 0
			};
			calling(ScrollMarks.add).with(params).should.not.throw();
		});

		it('should accept a percentage', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				offset: '25%'
			};
			calling(ScrollMarks.add).with(params).should.not.throw();
		});

		it('should accept a function', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				offset: () => {}
			};
			calling(ScrollMarks.add).with(params).should.not.throw();
		});

		it('should not accept a non-pecentage string', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				offset: '25'
			};
			calling(ScrollMarks.add).with(params).should.throw(TypeError);
		});

	});

	describe('direction parameter', function () {
		
		it('should accept \'up\'', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				direction: 'up'
			};
			calling(ScrollMarks.add).with(params).should.not.throw();
		});

		it('should accept \'down\'', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				direction: 'down'
			};
			calling(ScrollMarks.add).with(params).should.not.throw();
		});

		it('should not accept something else', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				direction: true
			};
			calling(ScrollMarks.add).with(params).should.throw();

			params.direction = 'sideways';
			calling(ScrollMarks.add).with(params).should.throw();
		});

	});

	describe('once parameter', function () {
		
		it('should accept boolean', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				once: true
			};
			calling(ScrollMarks.add).with(params).should.not.throw();

			params.once = false;
			calling(ScrollMarks.add).with(params).should.not.throw();

		});

		it('should not accept something else', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				once: 'true'
			};
			calling(ScrollMarks.add).with(params).should.throw();
		});
	});

});
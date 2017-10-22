describe('ScrollMarks.add()', function () {

	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.callback = function () {};
		this.timeout = (ScrollMarks.config().scrollThrottle + 1) / 60 * 1000; // excepted execution + 1 frame
		this.params = {
			element: this.element,
			callback: this.callback
		};
	});
	
	it('should exist', function () {
		ScrollMarks.add.should.be.a('function');
	});

	it('should return a number', function () {
		var mark = ScrollMarks.add({ element: this.element, callback: this.callback });
		mark.should.be.a('number');
		ScrollMarks.remove(mark);

	});

	describe('when called', function () {

		it('should start listening', function (done) {
			var callback = sinon.spy();
			var mark;
			
			window.scrollTo(0,0);
			document.body.style.height = '200vh';
			mark = ScrollMarks.add({element: this.element, callback: callback});
			window.scrollTo(0,100);

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
			window.scrollTo(0,100);
			marks.push(ScrollMarks.add({element: this.element, callback: callback}));
			marks.push(ScrollMarks.add({element: this.element, callback: downCallback, direction: "down"}));
			marks.push(ScrollMarks.add({element: this.element, callback: upCallback, direction: "up"}));
			
			setTimeout(function () {
				callback.should.have.been.calledOnce;
				downCallback.should.have.been.calledOnce;
				upCallback.should.not.have.been.called;
				done();
				marks.forEach(function (mark) {
					ScrollMarks.remove(mark);
				})
			}, this.timeout);
		});

	});
	
	describe('element parameter', function () {
		
		it('should be mandatory', function () {
			calling(ScrollMarks.add).with({ callback: this.callback }).should.throw(TypeError);
		});

		it('should accept an HTML Element', function () {
			calling(function() {
				var mark = ScrollMarks.add(this.params);
				ScrollMarks.remove(mark);
			}).on(this).should.not.throw();
		});
		
		it('should not accept something else', function () {
			calling(ScrollMarks.add).with({ element: "a", callback: this.callback }).should.throw(TypeError);
		});

	});

	describe('callback parameter', function () {
		
		it('should be mandatory', function () {
			calling(ScrollMarks.add).with({ element: this.element }).should.throw(TypeError);
		});

		it('should accept a function', function () {
			calling(function() {
				var mark = ScrollMarks.add(this.params);
				ScrollMarks.remove(mark);
			}).on(this).should.not.throw();
		});
		
		it('should not accept something else', function () {
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
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();
		});

		it('should accept a percentage value', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				offset: '25%'
			};
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();
		});

		it('should accept a px value', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				offset: '25px'
			};
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();		});

		it('should accept a function', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				offset: function () {}
			};
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();
		});

		it('should not accept any other string', function () {
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
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();
		});

		it('should accept \'down\'', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				direction: 'down'
			};
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();
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
		
		it('should accept a boolean', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				once: true
			};
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();

			params.once = false;
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();

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

	describe('debug parameter', function () {
		it('should accept boolean', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				debug: true
			};
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();

			params.debug = false;
			
			calling(function() {
				var mark = ScrollMarks.add(params);
				ScrollMarks.remove(mark);
			}).should.not.throw();
		});

		it('should not accept something else', function () {
			var params = {
				element: this.element,
				callback: this.callback,
				debug: 'true'
			};
			
			calling(ScrollMarks.add).with(params).should.throw();
		});
	});

});
describe('Scrollmarks.add()', function () {

	before(function () {
		fixture.setBase("test/fixtures");
		fixture.load("static_position.html");
		this.element = document.getElementById('static');
		this.emptyCallback = function () {};
		this.defaultParams = {
			element: this.element,
			callback: this.emptyCallback
		};
		this.timeout = (Scrollmarks.config().scrollThrottle + 2) / 60 * 1000; // excepted execution + 2 frames
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

	describe('when called', function () {

		it('should start listening', function (done) {
			var callback = sinon.spy();
			var mark;
			
			document.body.style.height = '200vh';
			window.scrollTo(0, 0);
			mark = Scrollmarks.add({element: this.element, callback: callback});
			window.scrollWithEvent(100);

			setTimeout(function () {
				callback.should.have.been.calledOnce;
				Scrollmarks.remove(mark);
				done();
			}, this.timeout);
		});

		it('should trigger callback if element is passed and direction is not "up"', function (done) {
			var callback = sinon.spy();
			var downCallback = sinon.spy();
			var upCallback = sinon.spy();
			var marks = [];

			window.scrollWithEvent(0);
			document.body.style.height = '200vh';
			window.scrollWithEvent(100);
			marks.push(Scrollmarks.add({element: this.element, callback: callback}));
			marks.push(Scrollmarks.add({element: this.element, callback: downCallback, direction: "down"}));
			marks.push(Scrollmarks.add({element: this.element, callback: upCallback, direction: "up"}));
			
			setTimeout(function () {
				callback.should.have.been.calledOnce;
				downCallback.should.have.been.calledOnce;
				upCallback.should.not.have.been.called;
				done();
				marks.forEach(function (mark) {
					Scrollmarks.remove(mark);
				})
			}, this.timeout);
		});

	});
	
	describe('element parameter', function () {
		
		it('should be mandatory', function () {
			calling(Scrollmarks.add).with({ callback: function () {} }).should.throw(TypeError);
		});

		it('should accept an HTML Element', function () {
			calling(function() {
				var mark = Scrollmarks.add(this.defaultParams);
				Scrollmarks.remove(mark);
			}).on(this).should.not.throw();
		});
		
		it('should not accept something else', function () {
			calling(Scrollmarks.add).with({ element: "a", callback: this.emptyCallback }).should.throw(TypeError);
		});

	});

	describe('callback parameter', function () {
		
		it('should be mandatory', function () {
			calling(Scrollmarks.add).with({ element: this.element }).should.throw(TypeError);
		});

		it('should accept a function', function () {
			calling(function() {
				var mark = Scrollmarks.add(this.defaultParams);
				Scrollmarks.remove(mark);
			}).on(this).should.not.throw();
		});
		
		it('should not accept something else', function () {
			calling(Scrollmarks.add).with({ element: this.element, callback: "a" }).should.throw(TypeError);
		});

	});

	describe('offset parameter', function () {

		it('should accept a number', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				offset: 0
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();
		});

		it('should accept a percentage value', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				offset: '25%'
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();
		});

		it('should accept a px value', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				offset: '25px'
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();		});

		it('should accept a function', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				offset: function () {}
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();
		});

		it('should not accept any other string', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				offset: '25'
			};
			
			calling(Scrollmarks.add).with(params).should.throw(TypeError);
		});

	});

	describe('direction parameter', function () {
		
		it('should accept \'up\'', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				direction: 'up'
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();
		});

		it('should accept \'down\'', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				direction: 'down'
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();
		});

		it('should not accept something else', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				direction: true
			};
			
			calling(Scrollmarks.add).with(params).should.throw();

			params.direction = 'sideways';
			
			calling(Scrollmarks.add).with(params).should.throw();
		});

	});

	describe('once parameter', function () {
		
		it('should accept a boolean', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				once: true
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();

			params.once = false;
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();

		});

		it('should not accept something else', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				once: 'true'
			};
			
			calling(Scrollmarks.add).with(params).should.throw();
		});

	});

	describe('debug parameter', function () {
		it('should accept boolean', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				debug: true
			};
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();

			params.debug = false;
			
			calling(function() {
				var mark = Scrollmarks.add(params);
				Scrollmarks.remove(mark);
			}).should.not.throw();
		});

		it('should not accept something else', function () {
			var params = {
				element: this.element,
				callback: this.emptyCallback,
				debug: 'true'
			};
			
			calling(Scrollmarks.add).with(params).should.throw();
		});
	});

});
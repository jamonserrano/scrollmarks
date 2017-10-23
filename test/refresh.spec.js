describe('ScrollMarks.refresh()', function () {
		before(function () {
			fixture.setBase("test/fixtures");
			fixture.load("multiple_elements.html");
			
			ScrollMarks.config({ idleTimeout: 0 });

			this.offset1 = sinon.spy(function () {
				return 20;
			});
			this.offset2 = sinon.spy(function () {
				return 20;
			});

			this.mark1 = ScrollMarks.add({
				element: document.getElementById('el1'),
				callback: function () {},
				offset: this.offset1
			});
			this.mark2 = ScrollMarks.add({
				element: document.getElementById('el2'),
				callback: function () {},
				offset: this.offset2
			});

			this.offset1.reset();
			this.offset2.reset();
		});

		after(function () {
			ScrollMarks.remove(this.mark1);
			ScrollMarks.remove(this.mark2);
		});

		afterEach(function () {
			this.offset1.reset();
			this.offset2.reset();
		})

		it('should refresh all marks when called without params', function () {
			ScrollMarks.refresh();
			this.offset1.should.have.been.calledOnce;
			this.offset2.should.have.been.calledOnce;
		});

		it('should refresh the mark received as a param', function () {
			ScrollMarks.refresh(this.mark1);
			this.offset1.should.have.been.calledOnce;
			this.offset2.should.not.have.been.called;
		});

		it('should throw an error when trying to refresh an invalid mark', function () {
			calling(ScrollMarks.refresh).with('hello').should.throw(ReferenceError);
		});
})
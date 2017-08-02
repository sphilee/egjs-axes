import Hammer from "hammerjs";
import {PanInput} from "../../../src/inputType/PanInput";
import {PinchInput} from "../../../src/inputType/PinchInput";
import {UNIQUEKEY} from "../../../src/inputType/InputType";
import {DIRECTION} from "../../../src/const";

describe("PanInput", () => {
  describe("when hammer instance is shared", function() {
    beforeEach(() => {
      this.el = sandbox();
      this.inst1 = new PanInput(this.el);
      this.inst2 = new PinchInput(this.el);
      this.inst1.mapAxes(["x1","y1"]);
      this.inst2.mapAxes(["x2"]);
      const observer = {
        release() {},
        hold() {},
        change() {},
        options: {
          deceleration: 0.0001
        }
      };
      this.inst1.connect(observer);
      this.inst2.hammer = this.inst1.hammer;
      this.inst2.connect(observer);
    });
    afterEach(() => {
      if (this.inst1) {
        this.inst1.destroy();
        this.inst1 = null;
      }
      if (this.inst2) {
        this.inst2.destroy();
        this.inst2 = null;
      }
      cleanup();
    });
    it("should check multi event (pan/pinch)", (done) => {
      // Given
      const beforePanend = this.inst1.hammer.handlers["panend"][0];
      const beforePinchend = this.inst2.hammer.handlers["pinchend"][0];
      const onPanend = sinon.spy(beforePanend);
      const onPinchend = sinon.spy(beforePinchend);
      this.inst1.hammer.handlers["panend"][0] = onPanend;
      this.inst2.hammer.handlers["pinchend"][0] = onPinchend;
      
      // When
      expect(this.inst1.hammer).to.be.equal(this.inst2.hammer);
      expect(this.inst1.element).to.be.equal(this.inst2.element);

      // When
      Simulator.gestures.pan(this.el, {
          pos: [0, 0],
          deltaX: 50,
          deltaY: 50,
          duration: 200,
          easing: "linear"
      }, () => {
          // Then
          expect(onPanend.called).to.be.true;
          expect(onPinchend.called).to.be.false;
          
          Simulator.gestures.pinch(this.el, {
              duration: 500,
              scale: 0.5
          }, () => {
              // Then
              expect(onPanend.callCount).to.be.equal(1);
              expect(onPinchend.callCount).to.be.equal(1);
              this.inst1.hammer.handlers["panend"][0] = beforePanend;
              this.inst2.hammer.handlers["pinchend"][0] = beforePinchend;
              done();
          });
      }); 
    });
    it("should check multi dettached event (pan/pinch)", (done) => {
      // Given
      const beforePanend = this.inst1.hammer.handlers["panend"][0];
      const beforePinchend = this.inst2.hammer.handlers["pinchend"][0];
      const onPanend = sinon.spy(beforePanend);
      const onPinchend = sinon.spy(beforePinchend);
      this.inst1.hammer.handlers["panend"][0] = onPanend;
      this.inst2.hammer.handlers["pinchend"][0] = onPinchend;

      // When
      this.inst1.disconnect();
      expect(this.inst1.element).to.be.equal(this.inst2.element);

      // When
      Simulator.gestures.pan(this.el, {
          pos: [0, 0],
          deltaX: 50,
          deltaY: 50,
          duration: 200,
          easing: "linear"
      }, () => {
          // Then
          expect(onPanend.called).to.be.false;
          expect(onPinchend.called).to.be.false;

          Simulator.gestures.pinch(this.el, {
              duration: 500,
              scale: 0.5
          }, () => {
              // Then
              expect(onPanend.called).to.be.false;
              expect(onPinchend.callCount).to.be.equal(1);
              this.inst1.hammer.handlers["panend"][0] = beforePanend;
              this.inst2.hammer.handlers["pinchend"][0] = beforePinchend;
              done();
          });
      }); 
    });
  });  
  describe("instance method", function() {
    beforeEach(() => {
      this.inst = new PanInput(sandbox());
    });
    afterEach(() => {
      if (this.inst) {
        this.inst.destroy();
        this.inst = null;
      }
      cleanup();
    });
    it("should check 'mapAxes' method", () => {
      // when
      this.inst.mapAxes(["x"]);

      // then
      expect(this.inst.axes).to.be.eql(["x"]);
      expect(this.inst._direction).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);

      // when
      this.inst.mapAxes(["", "y"]);

      // then
      expect(this.inst.axes).to.be.eql(["", "y"]);
      expect(this.inst._direction).to.be.equal(DIRECTION.DIRECTION_VERTICAL);

      // when
      this.inst.mapAxes(["x", "y"]);

      // then
      expect(this.inst.axes).to.be.eql(["x", "y"]);
      expect(this.inst._direction).to.be.equal(DIRECTION.DIRECTION_ALL);

      // when
      this.inst.mapAxes(["x", "y", "z"]);

      // then
      expect(this.inst.axes).to.be.eql(["x", "y", "z"]);
      expect(this.inst._direction).to.be.equal(DIRECTION.DIRECTION_ALL);
    });
    it("should check status after disconnect", () => {
      // Given
      const beforeHammer = this.inst.hammer;
      this.inst.connect({});
      
      // When
      this.inst.disconnect();

      // Then
      expect(beforeHammer).to.be.not.exist;
      expect(this.observer).to.be.not.exist;
      expect(this.inst.element).to.be.exist;
      expect(UNIQUEKEY in this.inst.element).to.be.true;
      expect(this.inst._direction).to.be.equal(DIRECTION.DIRECTION_NONE);
    });
    it("should check status after destroy", () => {
      // Given
      this.inst.connect({});
      
      // When
      this.inst.destroy();

      // Then
      expect(this.inst.hammer).to.be.not.exist;
      expect(this.inst.element).to.be.not.exist;
      expect(this.observer).to.be.not.exist;
      expect(this.inst._direction).to.be.equal(DIRECTION.DIRECTION_NONE);
      
      this.inst = null;
    });
  });
  describe("enable/disable", function() {
    beforeEach(() => {
      this.el = sandbox();
      this.inst = new PanInput(this.el);
      this.inst.mapAxes(["x1","y1"]);
      this.observer = {
        release() {},
        hold() {},
        change() {},
        options: {
          deceleration: 0.0001
        }
      };
    });
    afterEach(() => {
      if (this.inst) {
        this.inst.destroy();
        this.inst = null;
      }
      cleanup();
    });

    it("should check value of `enable/disalbe` methods", () => {
      // Given
      // When
      // Then
      expect(this.inst.isEnable()).to.be.false;

      // When
      this.inst.disable();

      // Then
      expect(this.inst.isEnable()).to.be.false;

      // When (hammer is not exist)
      this.inst.enable();

      // Then
      expect(this.inst.hammer).to.be.not.exist;
      expect(this.inst.isEnable()).to.be.false;

      // When (hammer is exist)
      this.inst.connect(this.observer);
      this.inst.enable();

      // Then
      expect(this.inst.hammer).to.be.exist;
      expect(this.inst.isEnable()).to.be.true;
    });    
    it("should check event when enable method is called", (done) => {
      // Given
      this.inst.connect(this.observer);
      const beforeHandler = this.inst.hammer.handlers["panend"][0];

      // When
      expect(this.inst.isEnable()).to.be.true;
      const onPanEndHandler = sinon.spy(beforeHandler);
      this.inst.hammer.handlers["panend"][0] = onPanEndHandler;

      // When
      Simulator.gestures.pan(this.el, {
          pos: [0, 0],
          deltaX: 50,
          deltaY: 50,
          duration: 200,
          easing: "linear"
      }, () => {
          // Then
          expect(onPanEndHandler.called).to.be.true;
          this.inst.hammer.handlers["panend"][0] = beforeHandler;
          done();
      });
    });
    it("should check event when disable method is called", (done) => {
      // Given
      this.inst.connect(this.observer);
      const beforeHandler = this.inst.hammer.handlers["panend"][0];
      // When

      const onPanEndHandler = sinon.spy(beforeHandler);
      this.inst.hammer.handlers["panend"][0] = onPanEndHandler;
      expect(this.inst.isEnable()).to.be.true;
      this.inst.disable();

      // When
      Simulator.gestures.pan(this.el, {
          pos: [0, 0],
          deltaX: 50,
          deltaY: 50,
          duration: 200,
          easing: "linear"
      }, () => {
          // Then
          expect(onPanEndHandler.called).to.be.false;
          this.inst.hammer.handlers["panend"][0] = beforeHandler;
          done();
      });
    });  
  });

  describe("static method", function() {
    it("should check user's direction", () => {
      //Given
      // When thresholdAngle = 45
      // Then
      expect(PanInput.getDirectionByAngle(0, 45)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(20, 45)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(45, 45)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(100, 45)).to.be.equal(DIRECTION.DIRECTION_VERTICAL);
      expect(PanInput.getDirectionByAngle(134, 45)).to.be.equal(DIRECTION.DIRECTION_VERTICAL);
      expect(PanInput.getDirectionByAngle(135, 45)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(136, 45)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(180, 45)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);

      // When thresholdAngle = 20
      // Then
      expect(PanInput.getDirectionByAngle(0, 20)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(10, 20)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(20, 20)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(30, 20)).to.be.equal(DIRECTION.DIRECTION_VERTICAL);
      expect(PanInput.getDirectionByAngle(50, 20)).to.be.equal(DIRECTION.DIRECTION_VERTICAL);
      expect(PanInput.getDirectionByAngle(160, 20)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(161, 20)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);
      expect(PanInput.getDirectionByAngle(180, 20)).to.be.equal(DIRECTION.DIRECTION_HORIZONTAL);

      // When thresholdAngle = -10, 100
      expect(PanInput.getDirectionByAngle(0, -10)).to.be.equal(DIRECTION.DIRECTION_NONE);
      expect(PanInput.getDirectionByAngle(0, 100)).to.be.equal(DIRECTION.DIRECTION_NONE);
    });

    it("should check 'getNextOffset' method", () => {
      // 0.001
      expect(PanInput.getNextOffset([1.5, 1], 0.001)).to.be.eql([1352.0817282989958, 901.3878188659972]);
      expect(PanInput.getNextOffset([1, 1.5], 0.001)).to.be.eql([901.3878188659972, 1352.0817282989958]);

      // 0.01
      expect(PanInput.getNextOffset([1.5, 1], 0.01)).to.be.eql([135.20817282989958, 90.13878188659973]);
      expect(PanInput.getNextOffset([1, 1.5], 0.01)).to.be.eql([90.13878188659973, 135.20817282989958]);
    });

    it("should check 'useDirection' method", () => {
      // DIRECTION_HORIZONTAL
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_ALL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_VERTICAL)).to.be.false;

      // DIRECTION_VERTICAL
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_ALL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.false;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_VERTICAL)).to.be.true;
    });

    it("should check 'useDirection' method (using userDirection)", () => {
      // DIRECTION_HORIZONTAL
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_ALL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_ALL, DIRECTION.DIRECTION_VERTICAL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_VERTICAL)).to.be.false;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.false;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_VERTICAL)).to.be.false;

      // DIRECTION_VERTICAL
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_ALL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_ALL, DIRECTION.DIRECTION_VERTICAL)).to.be.true;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.false;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_HORIZONTAL, DIRECTION.DIRECTION_VERTICAL)).to.be.false;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_HORIZONTAL)).to.be.false;
      expect(PanInput.useDirection(DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_VERTICAL, DIRECTION.DIRECTION_VERTICAL)).to.be.true;
    });
  });
});
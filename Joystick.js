"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JoyStick = function () {
	function JoyStick(options) {
		var _this = this;

		_classCallCheck(this, JoyStick);

		var circle = document.createElement("div");
		circle.style.cssText = "position:absolute; bottom:35px; width:80px; height:80px; background:rgba(126, 126, 126, 0.5); border:#444 solid medium; border-radius:50%; left:50%; transform:translateX(-50%);";
		var thumb = document.createElement("div");
		thumb.style.cssText = "position: absolute; left: 20px; top: 20px; width: 40px; height: 40px; border-radius: 50%; background: #fff;";
		circle.appendChild(thumb);
		document.body.appendChild(circle);
		this.domElement = thumb;
		this.maxRadius = options.maxRadius || 40;
		this.maxRadiusSquared = this.maxRadius * this.maxRadius;
		this.onMove = options.onMove;
		this.game = options.game;
		this.origin = { left: this.domElement.offsetLeft, top: this.domElement.offsetTop };
		this.rotationDamping = options.rotationDamping || 0.06;
		this.moveDamping = options.moveDamping || 0.01;
		if (this.domElement != undefined) {
			(function () {
				var joystick = _this;
				if ('ontouchstart' in window) {
					_this.domElement.addEventListener('touchstart', function (evt) {
						joystick.tap(evt);
					});
				} else {
					_this.domElement.addEventListener('mousedown', function (evt) {
						joystick.tap(evt);
					});
				}
			})();
		}
	}

	_createClass(JoyStick, [{
		key: "getMousePosition",
		value: function getMousePosition(evt) {
			var clientX = evt.targetTouches ? evt.targetTouches[0].pageX : evt.clientX;
			var clientY = evt.targetTouches ? evt.targetTouches[0].pageY : evt.clientY;
			return { x: clientX, y: clientY };
		}
	}, {
		key: "tap",
		value: function tap(evt) {
			evt = evt || window.event;
			// get the mouse cursor position at startup:
			this.offset = this.getMousePosition(evt);
			var joystick = this;
			if ('ontouchstart' in window) {
				document.ontouchmove = function (evt) {
					joystick.move(evt);
				};
				document.ontouchend = function (evt) {
					joystick.up(evt);
				};
			} else {
				document.onmousemove = function (evt) {
					joystick.move(evt);
				};
				document.onmouseup = function (evt) {
					joystick.up(evt);
				};
			}
		}
	}, {
		key: "move",
		value: function move(evt) {
			evt = evt || window.event;
			var mouse = this.getMousePosition(evt);
			// calculate the new cursor position:
			var left = mouse.x - this.offset.x;
			var top = mouse.y - this.offset.y;
			//this.offset = mouse;

			var sqMag = left * left + top * top;
			if (sqMag > this.maxRadiusSquared) {
				//Only use sqrt if essential
				var magnitude = Math.sqrt(sqMag);
				left /= magnitude;
				top /= magnitude;
				left *= this.maxRadius;
				top *= this.maxRadius;
			}
			// set the element's new position:
			this.domElement.style.top = top + this.domElement.clientHeight / 2 + "px";
			this.domElement.style.left = left + this.domElement.clientWidth / 2 + "px";

			var forward = -(top - this.origin.top + this.domElement.clientHeight / 2) / this.maxRadius;
			var turn = (left - this.origin.left + this.domElement.clientWidth / 2) / this.maxRadius;

			if (this.onMove != undefined) this.onMove.call(this.game, forward, turn);
		}
	}, {
		key: "up",
		value: function up(evt) {
			if ('ontouchstart' in window) {
				document.ontouchmove = null;
				document.touchend = null;
			} else {
				document.onmousemove = null;
				document.onmouseup = null;
			}
			this.domElement.style.top = this.origin.top + "px";
			this.domElement.style.left = this.origin.left + "px";

			this.onMove.call(this.game, 0, 0);
		}
	}]);

	return JoyStick;
}();

module.exports = { JoyStick: JoyStick };
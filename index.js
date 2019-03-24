var THREE = require("three");
var Zlib = require("./inflate.min").Zlib;
var CannonHelper = require('./CannonHelper').CannonHelper;
var CannonDebugRenderer = require("./CannonDebugRenderer").CannonDebugRenderer;
var Joystick = require('./Joystick').JoyStick;
var GLTFLoader = require('./GLTFLoader').GLTFLoader;
var FBXLoader = require('./FBXLoader').FBXLoader;

module.exports = {
  Joystick: Joystick,
  Zlib: Zlib,
  CannonDebugRenderer: CannonDebugRenderer,
  GLTFLoader: GLTFLoader,
  FBXLoader: FBXLoader,
  CannonHelper: CannonHelper
};

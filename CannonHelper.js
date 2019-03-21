'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var THREE = require('three');
var CANNON = require('cannon');

var CannonHelper = function () {
	function CannonHelper(scene) {
		_classCallCheck(this, CannonHelper);

		this.scene = scene;
	}

	_createClass(CannonHelper, [{
		key: 'addLights',
		value: function addLights(renderer) {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

			// LIGHTS
			var ambient = new THREE.AmbientLight(0x888888);
			this.scene.add(ambient);

			var light = new THREE.DirectionalLight(0xdddddd);
			light.position.set(3, 10, 4);
			light.target.position.set(0, 0, 0);

			light.castShadow = true;

			var lightSize = 10;
			light.shadow.camera.near = 1;
			light.shadow.camera.far = 50;
			light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
			light.shadow.camera.right = light.shadow.camera.top = lightSize;

			light.shadow.mapSize.width = 1024;
			light.shadow.mapSize.height = 1024;

			this.sun = light;
			this.scene.add(light);
		}
	}, {
		key: 'createCannonTrimesh',
		value: function createCannonTrimesh(geometry) {
			if (!geometry.isBufferGeometry) return null;

			var posAttr = geometry.attributes.position;
			var vertices = geometry.attributes.position.array;
			var indices = [];
			for (var i = 0; i < posAttr.count; i++) {
				indices.push(i);
			}

			return new CANNON.Trimesh(vertices, indices);
		}
	}, {
		key: 'createCannonConvex',
		value: function createCannonConvex(geometry) {
			if (!geometry.isBufferGeometry) return null;

			var posAttr = geometry.attributes.position;
			var floats = geometry.attributes.position.array;
			var vertices = [];
			var faces = [];
			var face = [];
			var index = 0;
			for (var i = 0; i < posAttr.count; i += 3) {
				vertices.push(new CANNON.Vec3(floats[i], floats[i + 1], floats[i + 2]));
				face.push(index++);
				if (face.length == 3) {
					faces.push(face);
					face = [];
				}
			}

			return new CANNON.ConvexPolyhedron(vertices, faces);
		}
	}, {
		key: 'addVisual',
		value: function addVisual(body, name) {
			var castShadow = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
			var receiveShadow = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

			body.name = name;
			if (this.currentMaterial === undefined) this.currentMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
			if (this.settings === undefined) {
				this.settings = {
					stepFrequency: 60,
					quatNormalizeSkip: 2,
					quatNormalizeFast: true,
					gx: 0,
					gy: 0,
					gz: 0,
					iterations: 3,
					tolerance: 0.0001,
					k: 1e6,
					d: 3,
					scene: 0,
					paused: false,
					rendermode: "solid",
					constraints: false,
					contacts: false, // Contact points
					cm2contact: false, // center of mass to contact points
					normals: false, // contact normals
					axes: false, // "local" frame axes
					particleSize: 0.1,
					shadows: false,
					aabbs: false,
					profiling: false,
					maxSubSteps: 3
				};
				this.particleGeo = new THREE.SphereGeometry(1, 16, 8);
				this.particleMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
			}
			// What geometry should be used?
			var mesh = void 0;
			if (body instanceof CANNON.Body) mesh = this.shape2Mesh(body, castShadow, receiveShadow);

			if (mesh) {
				// Add body
				body.threemesh = mesh;
				mesh.castShadow = castShadow;
				mesh.receiveShadow = receiveShadow;
				this.scene.add(mesh);
			}
		}
	}, {
		key: 'shape2Mesh',
		value: function shape2Mesh(body, castShadow, receiveShadow) {
			var obj = new THREE.Object3D();
			var material = this.currentMaterial;
			var game = this;
			var index = 0;

			body.shapes.forEach(function (shape) {
				var _this = this;

				var mesh = void 0;
				var geometry = void 0;
				var v0 = void 0,
				    v1 = void 0,
				    v2 = void 0;

				var i;
				var j;

				(function () {
					switch (shape.type) {

						case CANNON.Shape.types.SPHERE:
							var sphere_geometry = new THREE.SphereGeometry(shape.radius, 8, 8);
							mesh = new THREE.Mesh(sphere_geometry, material);
							break;

						case CANNON.Shape.types.PARTICLE:
							mesh = new THREE.Mesh(game.particleGeo, game.particleMaterial);
							var s = _this.settings;
							mesh.scale.set(s.particleSize, s.particleSize, s.particleSize);
							break;

						case CANNON.Shape.types.PLANE:
							geometry = new THREE.PlaneGeometry(10, 10, 4, 4);
							mesh = new THREE.Object3D();
							var submesh = new THREE.Object3D();
							var ground = new THREE.Mesh(geometry, material);
							ground.scale.set(100, 100, 100);
							submesh.add(ground);

							mesh.add(submesh);
							break;

						case CANNON.Shape.types.BOX:
							var box_geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2, shape.halfExtents.y * 2, shape.halfExtents.z * 2);
							mesh = new THREE.Mesh(box_geometry, material);
							break;

						case CANNON.Shape.types.CONVEXPOLYHEDRON:
							var geo = new THREE.Geometry();

							// Add vertices
							shape.vertices.forEach(function (v) {
								geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
							});

							shape.faces.forEach(function (face) {
								// add triangles
								var a = face[0];
								for (var _j = 1; _j < face.length - 1; _j++) {
									var b = face[_j];
									var c = face[_j + 1];
									geo.faces.push(new THREE.Face3(a, b, c));
								}
							});
							geo.computeBoundingSphere();
							geo.computeFaceNormals();
							mesh = new THREE.Mesh(geo, material);
							break;

						case CANNON.Shape.types.HEIGHTFIELD:
							geometry = new THREE.Geometry();

							v0 = new CANNON.Vec3();
							v1 = new CANNON.Vec3();
							v2 = new CANNON.Vec3();
							for (var xi = 0; xi < shape.data.length - 1; xi++) {
								for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
									for (var k = 0; k < 2; k++) {
										shape.getConvexTrianglePillar(xi, yi, k === 0);
										v0.copy(shape.pillarConvex.vertices[0]);
										v1.copy(shape.pillarConvex.vertices[1]);
										v2.copy(shape.pillarConvex.vertices[2]);
										v0.vadd(shape.pillarOffset, v0);
										v1.vadd(shape.pillarOffset, v1);
										v2.vadd(shape.pillarOffset, v2);
										geometry.vertices.push(new THREE.Vector3(v0.x, v0.y, v0.z), new THREE.Vector3(v1.x, v1.y, v1.z), new THREE.Vector3(v2.x, v2.y, v2.z));
										i = geometry.vertices.length - 3;

										geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
									}
								}
							}
							geometry.computeBoundingSphere();
							geometry.computeFaceNormals();
							mesh = new THREE.Mesh(geometry, material);
							break;

						case CANNON.Shape.types.TRIMESH:
							geometry = new THREE.Geometry();

							v0 = new CANNON.Vec3();
							v1 = new CANNON.Vec3();
							v2 = new CANNON.Vec3();
							for (var _i = 0; _i < shape.indices.length / 3; _i++) {
								shape.getTriangleVertices(_i, v0, v1, v2);
								geometry.vertices.push(new THREE.Vector3(v0.x, v0.y, v0.z), new THREE.Vector3(v1.x, v1.y, v1.z), new THREE.Vector3(v2.x, v2.y, v2.z));
								j = geometry.vertices.length - 3;

								geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
							}
							geometry.computeBoundingSphere();
							geometry.computeFaceNormals();
							mesh = new THREE.Mesh(geometry, MutationRecordaterial);
							break;

						default:
							throw "Visual type not recognized: " + shape.type;
					}
				})();

				mesh.receiveShadow = receiveShadow;
				mesh.castShadow = castShadow;

				mesh.traverse(function (child) {
					if (child.isMesh) {
						child.castShadow = castShadow;
						child.receiveShadow = receiveShadow;
					}
				});

				var o = body.shapeOffsets[index];
				var q = body.shapeOrientations[index++];
				mesh.position.set(o.x, o.y, o.z);
				mesh.quaternion.set(q.x, q.y, q.z, q.w);

				obj.add(mesh);
			});

			return obj;
		}
	}, {
		key: 'updateBodies',
		value: function updateBodies(world) {
			world.bodies.forEach(function (body) {
				if (body.threemesh != undefined) {
					body.threemesh.position.copy(body.position);
					body.threemesh.quaternion.copy(body.quaternion);
				}
			});
		}
	}]);

	return CannonHelper;
}();

module.exports = { CannonHelper: CannonHelper };
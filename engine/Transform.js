import { Component } from './Component.js';
import * as THREE from 'three';

export class Transform extends Component {
  constructor(gameObject) {
    super(gameObject);
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.scale = new THREE.Vector3(1, 1, 1);
    this._worldPosition = new THREE.Vector3();
    this._worldQuaternion = new THREE.Quaternion();
    this._worldScale = new THREE.Vector3(1, 1, 1);
    this._worldMatrix = new THREE.Matrix4();
  }

  updateWorldMatrix() {
    const localMatrix = new THREE.Matrix4();
    localMatrix.compose(this.position, new THREE.Quaternion().setFromEuler(this.rotation), this.scale);
    if (this.gameObject.parent) {
      const parentTransform = this.gameObject.parent.getComponent(Transform);
      parentTransform.updateWorldMatrix();
      this._worldMatrix.multiplyMatrices(parentTransform._worldMatrix, localMatrix);
    } else {
      this._worldMatrix.copy(localMatrix);
    }
    this._worldMatrix.decompose(this._worldPosition, this._worldQuaternion, this._worldScale);
  }

  getWorldPosition() {
    this.updateWorldMatrix();
    return this._worldPosition.clone();
  }
  getWorldQuaternion() {
    this.updateWorldMatrix();
    return this._worldQuaternion.clone();
  }
  getWorldScale() {
    this.updateWorldMatrix();
    return this._worldScale.clone();
  }
  getWorldRotation() {
    return new THREE.Euler().setFromQuaternion(this.getWorldQuaternion());
  }
  setFromWorldTransform(worldPos, worldQuat, worldScale) {
    if (this.gameObject.parent) {
      const parentTransform = this.gameObject.parent.getComponent(Transform);
      parentTransform.updateWorldMatrix();
      const parentMatrix = parentTransform._worldMatrix;
      const invParent = new THREE.Matrix4().copy(parentMatrix).invert();
      const localMatrix = new THREE.Matrix4();
      localMatrix.compose(worldPos, worldQuat, worldScale);
      localMatrix.premultiply(invParent);
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      localMatrix.decompose(pos, quat, scale);
      this.position.copy(pos);
      this.rotation.setFromQuaternion(quat);
      this.scale.copy(scale);
    } else {
      this.position.copy(worldPos);
      this.rotation.setFromQuaternion(worldQuat);
      this.scale.copy(worldScale);
    }
  }
} 
import { Component } from './Component.js';

export class MeshComponent extends Component {
  constructor(gameObject, mesh) {
    super(gameObject);
    this.mesh = mesh;
  }
} 
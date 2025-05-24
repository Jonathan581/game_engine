import { Component } from './Component.js';

export class LightComponent extends Component {
  constructor(gameObject, light, helper) {
    super(gameObject);
    this.light = light;
    this.helper = helper;
  }
  setColor(hex) {
    this.light.color.set(hex);
    if (this.helper && this.helper.color) this.helper.color.set(hex);
  }
  setIntensity(intensity) {
    this.light.intensity = intensity;
  }
  setDistance(distance) {
    if ('distance' in this.light) this.light.distance = distance;
  }
  setAngle(angle) {
    if ('angle' in this.light) this.light.angle = angle;
  }
} 
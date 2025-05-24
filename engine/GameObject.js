import { Transform } from './Transform.js';

export class GameObject {
  constructor(name) {
    this.id = GameObject.nextId++;
    this.name = name || `GameObject_${this.id}`;
    this.components = [];
    this.parent = null;
    this.children = [];
    this.addComponent(new Transform(this));
  }
  addComponent(component) {
    this.components.push(component);
    return component;
  }
  getComponent(type) {
    return this.components.find(c => c instanceof type);
  }
  addChild(child) {
    if (child.parent) child.parent.removeChild(child);
    child.parent = this;
    this.children.push(child);
  }
  removeChild(child) {
    this.children = this.children.filter(c => c !== child);
    child.parent = null;
  }
  isDescendantOf(go) {
    let p = this.parent;
    while (p) {
      if (p === go) return true;
      p = p.parent;
    }
    return false;
  }
}
GameObject.nextId = 1; 
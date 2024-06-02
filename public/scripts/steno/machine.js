import { Gemini } from "./machine/gemini.js";
import { Qwerty } from "./machine/qwerty.js";

export class Machine {
  constructor() {
    this.listeners = [];
    this.protocol = new Gemini(this);
    this.qwerty = new Qwerty(this);
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(steno_keys) {
    this.listeners.forEach((callback) => callback(steno_keys));
  }
}

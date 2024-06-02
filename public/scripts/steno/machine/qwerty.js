export class Qwerty {
  constructor(machine) {
    this.machine = machine;
    this.STENO_MAP = {
      q: "S-",
      a: "S-",
      w: "T-",
      s: "K-",
      e: "P-",
      d: "W-",
      r: "H-",
      f: "R-",
      c: "A",
      v: "O",
      t: "*",
      g: "*",
      y: "*",
      h: "*",
      n: "E",
      m: "U",
      u: "-F",
      j: "-R",
      i: "-P",
      k: "-B",
      o: "-L",
      l: "-G",
      p: "-T",
      ";": "-S",
      "[": "-D",
      "'": "-Z",
      1: "#",
      2: "#",
      3: "#",
      4: "#",
      5: "#",
      6: "#",
      7: "#",
      8: "#",
      9: "#",
      0: "#",
    };
    this.steno_keys = [];
    this.down_keys = [];
  }

  enable() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }

  disable() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  handleKeyDown = (event) => {
    let no_mod =
      !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    let key = event.key.toLowerCase();
    if (key in this.STENO_MAP && !this.down_keys.includes(key) && no_mod) {
      event.preventDefault();
      event.stopPropagation();
      this.down_keys.push(key);
      this.steno_keys.push(this.STENO_MAP[key]);
    }
  };
  handleKeyUp = (event) => {
    let key = event.key;
    if (key in this.STENO_MAP) {
      this.down_keys = this.down_keys.filter((k) => k !== key);
    }
    //all keys let go
    if (!this.down_keys[0] && this.steno_keys[0]) {
      this.machine.notifyListeners(this.steno_keys);
      this.steno_keys = [];
    }
  };
}

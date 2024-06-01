import { Word } from "./word.js";
import { Machine } from "./machine.js";

class StenoPad {
  constructor() {
    //DOM
    this.textarea = document.getElementById("main-textarea");

    //variables
    this.default_dictionary_path = ["main.json", "commands.json"];
    this.dictionaries = [];

    this.word_history = [];
    this.history_length = 100;
    this.default_space = " ";
    this.next_actions = [];

    //setup
    this.setup();
  }

  async setup() {
    await this.get_dictionaries();
    await this.load_text();
    this.loop_save();

    //machine
    this.machine = new Machine();
    this.machine.addListener(this.press.bind(this));
  }

  async get_dictionaries() {
    this.default_dictionary_path.forEach((url) => {
      fetch("dictionaries/" + url)
        .then((response) => response.json())
        .then((data) => {
          this.dictionaries.push(data);
        })
        .catch((error) => console.error("Error fetching JSON:", error));
    });
  }

  async loop_save() {
    this.save();
    setTimeout(this.loop_save.bind(this), 1000);
  }

  save() {
    localStorage.setItem("stenopad_text", this.textarea.value);
  }

  async load_text() {
    this.textarea.value = localStorage.getItem("stenopad_text");
  }

  press(steno_keys) {
    //raw output
    let raw_stroke = this.get_raw_stroke(steno_keys);
    let word = new Word(this, raw_stroke); //word.output and word.actions
    console.log(word);
    this.output(word);
    this.save();
  }

  undo_stroke() {
    //deletes from word history and text area
    let last_word = this.word_history.pop();
    if (!last_word || !last_word.output) {
      return;
    }
    console.log(`undoing ${last_word.output}`);
    let word_length = last_word.output.length;
    this.textarea.value = this.textarea.value.slice(0, -word_length);

    //redo if it was a compound word
    if (last_word.compound) {
      let second_last_word = this.word_history.slice(-1)[0];
      this.output(second_last_word);
    }
    return last_word;
  }

  soft_undo() {
    //deletes the textarea but does not delete from the word history
    let last_word = this.word_history.slice(-1)[0];
    if (!last_word) {
      return;
    }
    this.textarea.value = this.textarea.value.slice(
      0,
      -last_word.output.length
    );
    return last_word;
  }

  output(word) {
    this.textarea.value += word.output;
  }

  update_word_history(word) {
    this.word_history.push(word);
    if (this.word_history.length > this.history_length) {
      this.word_history.shift();
    }
  }

  get_raw_stroke(steno_keys) {
    return steno_keys
      .join("")
      .replace(/--/g, "x")
      .replace(/(?<!^)-/g, "")
      .replace(/x/g, "-")
      .replace(/SS/g, "S")
      .replace(/##/g, "#")
      .replace(/11/g, "1")
      .replace(/\*\*/g, "*");
  }

  send_keycode(keycode) {
    keycode = keycode.replace(/{#/g, "").replace(/}/g, "");
    let eventInfo = this.specialKeys[keycode];
    var event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: eventInfo.key,
      code: eventInfo.code,
      keyCode: eventInfo.keycode,
      which: eventInfo.keycode,
    });
    this.textarea.dispatchEvent(event);
  }
}

const stenopad = new StenoPad();
window.stenopad = stenopad;

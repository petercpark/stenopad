import { ActionHandler } from "./actions.js";

const NUMBER_KEYS = ["O", "S-", "T-", "P-", "H-", "A", "-F", "-P", "-L", "-T"];

export class Word {
  constructor(stenopad, steno_keys) {
    this.stenopad = stenopad;
    this.steno_keys = steno_keys;

    this.raw_stroke = this.get_raw_stroke(this.steno_keys);
    this.translation = "";
    this.output = "";
    this.compound = false;
    this.update_history = true;

    this.actions = new ActionHandler();

    this.main();
  }

  main() {
    this.translation = this.get_translation();
    this.output = this.translation;

    //undo stroke
    if (this.translation === "*") {
      this.output = "";
      this.stenopad.undo_stroke();
      return;
    }

    // special actions
    this.actions.main(this.stenopad, this);
    this.output = this.actions.output;

    if (this.update_history) {
      this.stenopad.update_word_history(this);
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

  get_translation() {
    let translation = "";

    for (let dictionary of this.stenopad.dictionaries) {
      // single stroke
      translation = dictionary[this.raw_stroke];

      // compound strokes
      let original_translation = translation;
      if (this.stenopad.word_history.length > 0) {
        for (let i = 0; i < this.stenopad.word_history.length; i++) {
          let n = 1 + i;
          let previous_words = this.stenopad.word_history.slice(-n);
          let previous_strokes = previous_words.map((word) => word.raw_stroke);
          let compound_stroke = [...previous_strokes, this.raw_stroke].join(
            "/"
          );
          let compound_translation = dictionary[compound_stroke];

          if (dictionary[compound_stroke]) {
            this.raw_stroke = compound_stroke;
            translation = compound_translation;
          }
        }
        if (original_translation !== translation) {
          this.stenopad.soft_undo();
          this.compound = true;
        }
      }

      //break if translation found
      if (translation) {
        break;
      }
    }

    // number
    if (this.raw_stroke.includes("#") && !translation) {
      translation = this.filter_number();
    }

    // raw
    translation = translation ? translation : this.raw_stroke;

    return translation;
  }

  filter_number() {
    let raw_numbers = Array.from(this.steno_keys).map((key) => {
      if (key === "#") {
        return;
      }
      let index = NUMBER_KEYS.indexOf(key);
      return index == -1 ? key : index;
    });

    if (/\d/.test(raw_numbers)) {
      this.actions.actions_list.push("glue", "word");
      return raw_numbers.join("");
    } else {
      return "";
    }
  }
}

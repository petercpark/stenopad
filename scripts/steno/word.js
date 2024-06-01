import { ActionHandler } from "./actions.js";

const NUMBER_KEYS = ["O", "S-", "T-", "P-", "H-", "A", "-F", "-P", "-L", "-T"];

export class Word {
  constructor(stenopad, raw_stroke) {
    this.stenopad = stenopad;
    this.raw_stroke = raw_stroke;
    this.translation = "";
    this.output = "";
    this.compound = false;

    this.actions;

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
    this.actions = new ActionHandler(this.stenopad, this);
    this.output = this.actions.output;

    this.stenopad.update_word_history(this);
  }

  get_translation() {
    let translation = "";

    // number
    if (this.raw_stroke.includes("#")) {
      translation = this.filter_number(this.raw_stroke);
    }

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

    // raw
    translation = translation ? translation : this.raw_stroke;

    return translation;
  }

  filter_number() {
    let raw_numbers = Array.from(this.raw_stroke).map((key) => {
      if (key === "#") {
        return;
      }
      let index = NUMBER_KEYS.indexOf(key);
      return index == -1 ? key : index;
    });
    let translation = /\d/.test(raw_numbers)
      ? filter_dash(raw_numbers)
      : "#" + filter_dash(raw_numbers);
    return translation;
  }
}

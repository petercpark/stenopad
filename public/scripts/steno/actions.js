//variables
const all_actions = {
  "^": "attach",
  "&": "glue",
  "*?": "retro_insert_space",
  "+!": "retro_delete_space",
  "\n": "newline",
  "\t": "tab",
  "+-|": "retro_cap_first_word",
  "-|": "cap_first_word",
  "*>": "retro_lower_first_char",
  ">": "lower_first_char",
  "*<": "retro_upper_first_word",
  "<": "upper_first_word",
  "~|": "carry_cap",
  ".": "stop",
  "?": "stop",
  "!": "stop",
  ",": "comma",
  ":": "comma",
  ";": "comma",
  "*+": "repeat_last_stroke",
  "#": "nothing",
};

const all_specialKeys = {
  backspace: { key: "Backspace", code: "Backspace", keyCode: 8 },
  tab: { key: "Tab", code: "Tab", keyCode: 9 },
  enter: { key: "Enter", code: "Enter", keyCode: 13 },
  shift: { key: "Shift", code: "ShiftLeft", keyCode: 16 }, // ShiftLeft for left shift
  control: { key: "Control", code: "ControlLeft", keyCode: 17 }, // ControlLeft for left control
  alt: { key: "Alt", code: "AltLeft", keyCode: 18 }, // AltLeft for left alt
  pause: { key: "Pause", code: "Pause", keyCode: 19 },
  capslock: { key: "CapsLock", code: "CapsLock", keyCode: 20 },
  escape: { key: "Escape", code: "Escape", keyCode: 27 },
  space: { key: " ", code: "Space", keyCode: 32 },
  pageup: { key: "PageUp", code: "PageUp", keyCode: 33 },
  pagedown: { key: "PageDown", code: "PageDown", keyCode: 34 },
  end: { key: "End", code: "End", keyCode: 35 },
  home: { key: "Home", code: "Home", keyCode: 36 },
  arrowleft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  arrowup: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  arrowright: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  arrowdown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  printscreen: {
    key: "PrintScreen",
    code: "PrintScreen",
    keyCode: 44,
  },
  insert: { key: "Insert", code: "Insert", keyCode: 45 },
  delete: { key: "Delete", code: "Delete", keyCode: 46 },
  f1: { key: "F1", code: "F1", keyCode: 112 },
  f2: { key: "F2", code: "F2", keyCode: 113 },
  f3: { key: "F3", code: "F3", keyCode: 114 },
  f4: { key: "F4", code: "F4", keyCode: 115 },
  f5: { key: "F5", code: "F5", keyCode: 116 },
  f6: { key: "F6", code: "F6", keyCode: 117 },
  f7: { key: "F7", code: "F7", keyCode: 118 },
  f8: { key: "F8", code: "F8", keyCode: 119 },
  f9: { key: "F9", code: "F9", keyCode: 120 },
  f10: { key: "F10", code: "F10", keyCode: 121 },
  f11: { key: "F11", code: "F11", keyCode: 122 },
  f12: { key: "F12", code: "F12", keyCode: 123 },
  numlock: { key: "NumLock", code: "NumLock", keyCode: 144 },
  scrolllock: { key: "ScrollLock", code: "ScrollLock", keyCode: 145 },
  win: { key: "Meta", code: "MetaLeft", keyCode: 91 },
  meta: { key: "Meta", code: "MetaLeft", keyCode: 91 },
  super: { key: "Meta", code: "MetaLeft", keyCode: 91 },
  contextmenu: {
    key: "ContextMenu",
    code: "ContextMenu",
    keyCode: 93,
  },
};

function splitArrayAtValue(array, value) {
  let index = array.indexOf(value);
  if (index === -1) {
    // Value not found in the array
    return [array, []];
  }
  let beforeValue = array.slice(0, index);
  let afterValue = array.slice(index + 1);
  return [beforeValue, afterValue];
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function capitalizeFirstLetter(string) {
  if (string.length === 0) {
    return string; // Return the original string if it's empty
  }
  for (let i = 0; i < string.length; i++) {
    if (string.charAt(i) !== " ") {
      return (
        string.slice(0, i) +
        string.charAt(i).toUpperCase() +
        string.slice(i + 1)
      );
    }
  }
  return string; // If the string consists only of spaces, return it unchanged
}

function lowerFirstLetter(string) {
  if (string.length === 0) {
    return string;
  }
  for (let i = 0; i < string.length; i++) {
    if (string.charAt(i) !== " ") {
      return (
        string.slice(0, i) +
        string.charAt(i).toLowerCase() +
        string.slice(i + 1)
      );
    }
  }
}

export class ActionHandler {
  constructor(stenopad, word) {
    this.stenopad = stenopad;
    this.word = word;

    this.detect_special_regex = /\{.*\}/s;

    this.translation = this.word.translation;
    this.output = this.word.output;
    this.actions_list = [];

    this.previous_word = this.stenopad.word_history.slice(-1)[0];

    this.carryover_actions =
      this.previous_word && this.previous_word.actions && !this.word.compound
        ? this.previous_word.actions.post_word_actions
        : [];

    //initialize lists of pre/post/no word actions
    this.pre_word_actions = this.previous_word ? [] : ["attach"];
    if (this.word.compound) {
      this.pre_word_actions.push(
        ...this.previous_word.actions.pre_word_actions
      );
    }
    this.pre_word_actions.push(...this.carryover_actions);
    this.post_word_actions = [];
    this.no_word_actions = [];

    this.main();
  }

  main() {
    if (this.translation.match(this.detect_special_regex)) {
      [this.output, this.actions_list] = this.get_special_actions();
    }
    this.handle_actions();
  }

  get_special_actions() {
    let word = {
      output: "",
      actions: [],
    };

    // e.g. ["{^}","hello"]
    let components = this.translation.split(/(\{.*?\})/).filter(Boolean);

    for (let component of components) {
      // if special
      if (component.match(this.detect_special_regex)) {
        //extract all actions
        let inner_string = component.replace(/[{}]/g, "");
        let action_keys = Object.keys(all_actions);

        const action_keys_pattern = new RegExp(
          `(${action_keys.map(escapeRegExp).join("|")})`,
          "g"
        );
        // list actions and handle words inside component
        let actions = inner_string
          .split(action_keys_pattern)
          .filter(Boolean)
          .map((action) => {
            if (action_keys.includes(action)) {
              let action_value = all_actions[action];
              if (action_value === "stop" || action_value === "comma") {
                word.output += action;
              }
              return action_value;
            } else {
              word.output += action;
              return "word";
            }
          });

        word.actions.push(...actions);
      }
      // not special
      else {
        word.actions.push("word");
        word.output += component;
      }
    }

    return [word.output, word.actions];
  }

  handle_actions() {
    if (!this.actions_list[0] && !this.pre_word_actions[0]) {
      //default behavior
      this.output = this.stenopad.default_space + this.translation;
      return;
    }

    //separate pre/post word actions
    if (this.actions_list.includes("word")) {
      let [pre, post] = splitArrayAtValue(this.actions_list, "word");
      this.pre_word_actions.push(...pre);
      this.post_word_actions.push(...post);
    } else {
      this.no_word_actions.push(...this.actions_list);
    }

    //preword actions
    this.handle_pre_word_actions(this.pre_word_actions);
    //postword actions
    this.handle_post_word_actions(this.post_word_actions);
    //no word actions
    this.handle_no_word_actions(this.no_word_actions);
  }

  handle_pre_word_actions(pre_word_actions) {
    //default behavior
    if (!pre_word_actions.includes("attach") && this.output) {
      this.output = this.stenopad.default_space + this.output;
    }
    for (let action of pre_word_actions) {
      switch (action) {
        case "attach":
          break;
        case "lower_first_char":
          this.output = lowerFirstLetter(this.output);
          break;
        case "glue":
          if (
            this.previous_word &&
            this.previous_word.actions.actions_list.includes("glue")
          ) {
            console.log("gluing");
            this.output = this.output.trimStart();
          }
          break;
        case "retro_insert_space": {
          let last_word = this.stenopad.undo_stroke();
          this.output = this.stenopad.default_space + last_word.output;
          break;
        }
        case "retro_delete_space": {
          let last_word = this.stenopad.undo_stroke();
          this.output = last_word.output.trimStart();
          break;
        }
        case "newline":
          this.output = "\n" + this.output;
          break;
        case "tab":
          this.output = "\t" + this.output;
          break;
        case "retro_cap_first_word": {
          let last_word = this.stenopad.undo_stroke();
          this.output = capitalizeFirstLetter(last_word.output) + this.output;
          break;
        }
        case "cap_first_word": {
          this.output = capitalizeFirstLetter(this.output);
          break;
        }
        case "retro_lower_first_char": {
          let last_word = this.stenopad.undo_stroke();
          this.output = lowerFirstLetter(last_word.output);
        }
        case "lower_first_char": {
          this.output = lowerFirstLetter(this.output);
          break;
        }
        case "retro_upper_first_word": {
          let last_word = this.stenopad.undo_stroke();
          this.output = last_word.output.toUpperCase();
          break;
        }
        case "upper_first_word": {
          this.output = this.output.toUpperCase();
          break;
        }
        case "carry_cap": {
          if (this.pre_word_actions.includes("cap_first_word")) {
            this.post_word_actions.push("cap_first_word");
            console.log(this.post_word_actions);
          }
          break;
        }
        case "stop":
          this.output = this.output.trimStart();
          this.post_word_actions.push("cap_first_word");
          break;
        case "comma":
          this.output = this.output.trimStart();
        default:
          break;
      }
    }
  }

  handle_post_word_actions(post_word_actions) {
    for (let action of post_word_actions) {
      //becomes the next word's preword action
    }
  }

  handle_no_word_actions(no_word_actions) {
    for (let action of no_word_actions) {
      //separate pre/post

      let pre_actions = [
        "newline",
        "tab",
        "stop",
        "comma",
        "carry_cap",
        "repeat_last_stroke",
        "nothing",
      ];

      if (action.startsWith("retro") || pre_actions.includes(action)) {
        this.handle_pre_word_actions([action]);
      } else {
        this.post_word_actions.push(action);
      }
    }
  }
}

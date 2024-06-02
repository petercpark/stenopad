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
const all_actions_keys = Object.keys(all_actions);
const action_keys_regex = new RegExp(
  `(${all_actions_keys.map(escapeRegExp).join("|")})`,
  "g"
);

const all_special_keys = [
  "backspace",
  "tab",
  "enter",
  "shift",
  "control",
  "alt",
  "pause",
  "capslock",
  "escape",
  "space",
  "pageup",
  "pagedown",
  "end",
  "home",
  "arrowleft",
  "arrowup",
  "arrowright",
  "arrowdown",
  "printscreen",
  "insert",
  "delete",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "f10",
  "f11",
  "f12",
  "numlock",
  "scrolllock",
  "win",
  "meta",
  "super",
  "contextmenu",
];

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

function emulateBackspace() {
  let textArea = document.querySelector("#main-textarea");
  let caretPos = textArea.selectionStart;

  // Ensure there is text in the textarea and caret is not at the beginning
  if (textArea.value.length > 0 && caretPos > 0) {
    // Remove the character before the caret
    let newText =
      textArea.value.substring(0, caretPos - 1) +
      textArea.value.substring(caretPos);

    // Update the text area with the new text and move the caret back
    textArea.value = newText;
    textArea.selectionStart = caretPos - 1;
    textArea.selectionEnd = caretPos - 1;
  }
}

export class ActionHandler {
  constructor() {
    this.actions_list = [];
    this.detect_special_regex = /\{.*\}/s;
  }

  main(stenopad, word) {
    this.stenopad = stenopad;
    this.word = word;

    this.translation = this.word.translation;
    this.output = this.word.output;

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

        // split inner by special action
        let actions = inner_string
          .split(action_keys_regex)
          .filter(Boolean)
          .map((action) => {
            // if special action
            if (all_actions_keys.includes(action)) {
              let action_value = all_actions[action];
              if (action_value === "stop" || action_value === "comma") {
                word.output += action;
              }
              return action_value;
            }
            // if special key (command, control, etc.)
            if (all_special_keys.includes(action.toLowerCase())) {
              return action.toLowerCase();
            }
            // else word
            word.output += action;
            return "word";
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
          }
          break;
        }
        case "stop":
          this.output = this.output.trimStart();
          this.post_word_actions.push("cap_first_word");
          break;
        case "comma":
          this.output = this.output.trimStart();
          break;
        case "nothing":
          this.output = "";
          break;
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
      //no word actions that are actually preword actions
      if (action.startsWith("retro") || pre_actions.includes(action)) {
        this.handle_pre_word_actions([action]);
        continue;
      }

      //if special key
      if (all_special_keys.includes(action.toLowerCase())) {
        this.handle_special_keys(action.toLowerCase());
        continue;
      }

      //else post word action
      this.post_word_actions.push(action);
    }
  }

  handle_special_keys(action) {
    this.word.update_history = false;
    switch (action) {
      case "backspace":
        emulateBackspace();
        break;
      default:
        break;
    }
  }
}

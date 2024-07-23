import { addData } from "./dictionary/database.js";

export class Dictionary {
  constructor() {
    this.default_dictionary_path = ["main.json", "commands.json"];

    this.load_dictionary_settings();
    this.selected_dictionaries = this.get_selected_dictionaries();
    this.dictionaries = {};
    this.listen_to_change();
  }

  load_dictionary_settings() {
    this.dictionary_settings = JSON.parse(
      localStorage.getItem("stenopad-dictionary-settings")
    );

    if (this.dictionary_settings) {
      let dictionary_list_element = document.querySelector(".dictionary-list");
      dictionary_list_element.innerHTML = "";
      //add rows
      for (const dict in this.dictionary_settings) {
        dictionary_list_element.innerHTML += `<li class="dictionary-list-item"><input type="checkbox" name="user" ${
          this.dictionary_settings[dict] ? "checked" : ""
        } /><label>${dict}</label></li>`;
      }
    }
  }

  save_dictionary_settings(all_dictionaries, selected_dictionaries) {
    let dictionary_settings = {};
    all_dictionaries.forEach((dictionary) => {
      dictionary_settings[dictionary] =
        selected_dictionaries.includes(dictionary);
    });
    localStorage.setItem(
      "stenopad-dictionary-settings",
      JSON.stringify(dictionary_settings)
    );
  }

  get_selected_dictionaries() {
    let dictionary_list = this.get_dictionary_list();
    let all_dictionaries = dictionary_list.map((element) =>
      element.textContent.trim()
    );
    let selected_dictionaries = dictionary_list
      .filter((element) => element.children[0].checked)
      .map((element) => element.textContent.trim());

    this.save_dictionary_settings(all_dictionaries, selected_dictionaries);

    return selected_dictionaries;
  }

  listen_to_change() {
    let dictionary_list = this.get_dictionary_list();
    dictionary_list.forEach((item) => {
      item.children[0].addEventListener(
        "change",
        function () {
          this.refresh_dictionaries();
          console.log("dictionaries refreshed!");
        }.bind(this)
      );
    });
  }

  refresh_dictionaries() {
    this.dictionaries = {};
    this.get_dictionaries();
  }

  get_dictionary_list() {
    return Array.from(document.querySelectorAll(".dictionary-list-item"));
  }

  async get_dictionaries() {
    let list_of_dictionaries = this.get_selected_dictionaries();
    list_of_dictionaries.forEach((dictionary_name) => {
      fetch("dictionaries/" + dictionary_name)
        .then((response) => response.json())
        .then((data) => {
          this.dictionaries[dictionary_name] = data;
        })
        .catch((error) => console.error("Error fetching JSON:", error));
    });
  }
}

function toggleOpacity(element) {
  if (element.classList.contains("visible")) {
    disappear(element);
  } else {
    appear(element);
  }
}

function disappear(element) {
  // Snappy disappearance
  element.style.transition = "opacity 0s";
  element.style.opacity = "0";
  element.classList.remove("visible");
  // Wait for the opacity to change before setting display to none
  setTimeout(() => {
    element.style.display = "none";
  }, 0);
}

function appear(element) {
  // Smooth appearance
  element.style.display = "block";
  // Force reflow to ensure the display change is applied
  void element.offsetWidth;
  element.style.transition = "opacity 0.3s ease-in-out";
  element.style.opacity = "1";
  element.classList.add("visible");
}

function addOpacityToggle(selector) {
  let element = document.querySelector(selector);
  let menu = document.querySelector(selector.replace("button", "menu"));
  element.addEventListener("click", function () {
    toggleOpacity(menu);
  });
  let textarea = document.querySelector("#main-textarea");
  textarea.addEventListener("click", function () {
    disappear(menu);
  });
}

function disappear_all_menu() {
  let all_menu = document.querySelectorAll(".menu");
  for (let menu of all_menu) {
    disappear(menu);
  }
}

export class Settings {
  constructor(stenopad) {
    this.stenopad = stenopad;

    //dark mode
    this.dark_mode();

    //qwerty steno
    this.qwerty_steno_mode();
  }

  qwerty_steno_mode() {
    let is_qwerty_mode = localStorage.getItem("qwerty-steno") === "enabled";
    this.enable_qwerty_button = document.querySelector("#qwerty-steno-button");

    // if previously enabled
    if (is_qwerty_mode || localStorage.getItem("qwerty-steno") === null) {
      this.enable_qwerty_steno();
    } else {
      //this.disable_qwerty_steno();
    }

    //add toggle
    this.enable_qwerty_button.addEventListener(
      "click",
      this.toggle_qwerty_steno.bind(this)
    );
  }

  toggle_qwerty_steno() {
    let is_qwerty_mode = localStorage.getItem("qwerty-steno") === "enabled";
    disappear_all_menu();
    if (is_qwerty_mode) {
      this.disable_qwerty_steno();
    } else {
      this.enable_qwerty_steno();
    }
    this.stenopad.textarea.focus();
  }

  enable_qwerty_steno() {
    this.enable_qwerty_button.textContent = "Disable Qwerty Steno";
    this.stenopad.machine.qwerty.enable();
    localStorage.setItem("qwerty-steno", "enabled");
  }

  disable_qwerty_steno() {
    this.enable_qwerty_button.textContent = "Enable Qwerty Steno";
    this.stenopad.machine.qwerty.disable();
    localStorage.setItem("qwerty-steno", "disabled");
  }

  dark_mode() {
    //menu visibility
    addOpacityToggle(".logo-button");
    addOpacityToggle(".three-dots-button");

    //dark/light mode
    const toggleButton = document.getElementById("toggle-dark-mode");

    // Check for previously saved dark mode preference
    if (localStorage.getItem("dark-mode") === "enabled") {
      document.body.classList.add("dark-mode");
      toggleButton.textContent = "Disable Dark Mode";
    }

    toggleButton.addEventListener("click", function () {
      document.body.classList.toggle("dark-mode");
      toggleButton.textContent =
        toggleButton.textContent.trim() === "Enable Dark Mode"
          ? "Disable Dark Mode"
          : "Enable Dark Mode";

      disappear_all_menu();

      // Save the current mode to localStorage
      if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("dark-mode", "enabled");
      } else {
        localStorage.setItem("dark-mode", "disabled");
      }
    });
  }
}

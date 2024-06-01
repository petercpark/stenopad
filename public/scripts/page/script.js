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

function disappear_all_menu() {
  let all_menu = document.querySelectorAll(".menu");
  for (let menu of all_menu) {
    disappear(menu);
  }
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

document.addEventListener("DOMContentLoaded", function () {
  //menu visibility
  addOpacityToggle(".logo-button");
  addOpacityToggle(".three-dots-button");

  //dark/light mode
  const toggleButton = document.getElementById("toggle-dark-mode");

  // Check for previously saved dark mode preference
  if (localStorage.getItem("dark-mode") === "enabled") {
    document.body.classList.add("dark-mode");
  }

  toggleButton.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    disappear_all_menu();

    // Save the current mode to localStorage
    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("dark-mode", "enabled");
    } else {
      localStorage.setItem("dark-mode", "disabled");
    }
  });
});

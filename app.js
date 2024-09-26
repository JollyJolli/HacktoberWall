// consts
const MOON = "🌜";
const SUN = "🌞";

// Function to load participants from the JSON file
async function loadContributors() {
  const response = await fetch("contributors.json");
  const contributors = await response.json();
  return contributors;
}

// Function to display participants on the mural
async function displayContributors() {
  const wall = document.getElementById("wall");
  const contributors = await loadContributors();
  wall.innerHTML = "";

  contributors.forEach((contributor, index) => {
    const div = document.createElement("div");
    div.classList.add("participant");
    div.textContent = contributor.name;
    div.style.animationDelay = `${index * 0.1}s`;
    wall.appendChild(div);
  });
}

// Function to Switch light/dark mode
function initializeDarkMode() {
  const toggleButton = document.getElementById("toggleButton");
  const body = document.body;

  const isDarkMode = localStorage.getItem("dark-mode") === "enabled";
  body.classList.toggle("dark-mode", isDarkMode);
  toggleButton.textContent = isDarkMode ? MOON : SUN;

  toggleButton.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDarkMode = body.classList.contains("dark-mode");
    localStorage.setItem("dark-mode", isDarkMode ? "enabled" : "disabled");
    toggleButton.textContent = isDarkMode ? MOON : SUN;
  });
}

function addParticipantHoverEffect() {
  const wall = document.getElementById("wall");
  wall.addEventListener("mouseover", (e) => {
    if (e.target.classList.contains("participant")) {
      e.target.style.transform = "translateY(-5px)";
    }
  });
  wall.addEventListener("mouseout", (e) => {
    if (e.target.classList.contains("participant")) {
      e.target.style.transform = "translateY(0)";
    }
  });
}

// Initialize the wall with existing contributors
window.onload = function () {
  displayContributors();
  initializeDarkMode();
  addParticipantHoverEffect();
};

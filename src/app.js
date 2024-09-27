// Font Awesome classes for sun and moon
const MOON = '<i class="fas fa-moon"></i>';
const SUN = '<i class="fas fa-sun"></i>';

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
  toggleButton.innerHTML = isDarkMode ? MOON : SUN;

  toggleButton.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDarkMode = body.classList.contains("dark-mode");
    localStorage.setItem("dark-mode", isDarkMode ? "enabled" : "disabled");
    toggleButton.innerHTML = isDarkMode ? MOON : SUN;
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

// Function to play spooky sound
function playSpookySound() {
  const audio = new Audio('halloween-impact-05.mp3'); 
  audio.play();
}

// Function to show Halloween icon
function showHalloweenIcon() {
  const icon = document.getElementById('halloweenIcon');
  icon.style.display = 'inline'; 
  setTimeout(() => {
    icon.style.display = 'none';
  }, 4000); 
}

// Add event listener for the title link
document.getElementById('titleLink').addEventListener('click', (e) => {
  e.preventDefault(); 
  const body = document.body;

  if (body.classList.contains('dark-mode')) {
    playSpookySound();
    showHalloweenIcon();
  }
});

// Easter Egg
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑ ↑ ↓ ↓ ← → ← → B A
let konamiIndex = 0;

document.addEventListener("keydown", function (event) {
  if (event.keyCode === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      activateNeonMode();
      console.log("Konami Code Activated")
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

function activateNeonMode() {
  document.body.classList.add("neon-mode");
}
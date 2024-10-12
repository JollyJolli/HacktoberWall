// Font Awesome classes for sun and moon
const MOON = '<i class="fas fa-moon"></i>';
const SUN = '<i class="fas fa-sun"></i>';
let toggleCount = 0; // Counter to track the number of clicks
let cachedContributors = null;

// Const definitions for modal
const modal = document.querySelector(".modal");
const modalWrapper = document.querySelector(".modal-wrapper");
const modalContent = document.querySelector(".modal-content");
const modalClose = document.querySelector(".close-modal-button");

modalClose.addEventListener("click", closeModal);

// Function to load participants from the JSON file
async function loadContributors() {
  if (cachedContributors !== null) {
    return cachedContributors;
  }

  let contributors = null;
  showLoadingScreen();

  try {
    const response = await fetch("contributors.json");

    // Check if the response is not OK (status not in the range 200-299)
    if (!response.ok) {
      throw new Error(
        `Failed to load contributors: HTTP status ${response.status} (${response.statusText})`
      );
    }

    contributors = await response.json();
    cachedContributors = contributors;
  } catch (error) {
    console.error("Error loading contributors:", error);

    // Provide a detailed error message to the user
    alert(
      "Oops! Something went wrong while loading the contributors. Please try again later.\n\n" +
        "Error details: " +
        error.message
    );
  } finally {
    hideLoadingScreen(); // Ensure the loading screen is hidden regardless of success or failure
  }

  return contributors;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to display participants on the mural
async function displayContributors(filter = "") {
  const wall = document.getElementById("wall");
  const contributors = await loadContributors();
  wall.innerHTML = "";

  // Suffle the contributors name
  shuffle(contributors);

  contributors.forEach((contributor, index) => {
    if (contributor.name.toLowerCase().includes(filter.toLowerCase())) {
      const div = document.createElement("div");
      div.classList.add("participant");
      div.textContent = contributor.name;
      div.style.animationDelay = `${index * 0.1}s`;
      wall.appendChild(div);
    }
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

    // Increment the toggle count and check if it's been toggled twice
    toggleCount++;

    if (toggleCount === 2) {
      activateRainbowMode();
      toggleCount = 0; // Reset the counter after activating rainbow mode
    }
  });
}

function activateRainbowMode() {
  const body = document.body;
  body.classList.add("rainbow-mode");

  // Remove rainbow mode after 10 seconds or adjust as needed
  setTimeout(() => {
    body.classList.remove("rainbow-mode");
  }, 5000);
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

const funFacts = [
  "The first Hacktoberfest event was held in 2014.",
  "Hacktoberfest was created by DigitalOcean and GitHub.",
  "Open source software powers much of the internet's infrastructure.",
  "The term 'open source' was coined in 1998.",
  "Linux, the most famous open source project, was created in 1991.",
];

const sections = ["intro", "wall-section"];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function showFunFact() {
  const fact = getRandomItem(funFacts);
  const isDarkMode = localStorage.getItem("dark-mode");
  if (isDarkMode === "enabled") {
    modalWrapper.classList.add("modal-dark-mode");
  } else {
    modalWrapper.classList.remove("modal-dark-mode");
  }
  modal.setAttribute("aria-hidden", false);
  modal.setAttribute("aria-modal", true);
  modal.classList.remove("hidden");
  modalContent.textContent = fact;
}

// Function to close modal
function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", true);
  modal.removeAttribute("aria-modal");
  modalContent.textContent = "";
}

// function to close modal with a click anywhere on the page
window.onclick = function (event) {
  if (event.target === modal) {
    closeModal();
  }
};

function scrollToRandomSection() {
  const section = getRandomItem(sections);
  const element = document.querySelector(`.${section}`);
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleSurprise() {
  if (Math.random() < 0.5) {
    showFunFact();
  } else {
    scrollToRandomSection();
  }
}

function initializeSurpriseButton() {
  const surpriseButton = document.getElementById("surpriseButton");
  surpriseButton.addEventListener("click", handleSurprise);
}

// Initialize the wall with existing contributors
window.onload = function () {
  displayContributors();
  initializeDarkMode();
  addParticipantHoverEffect();
  initializeSearch();
  initializeSurpriseButton();
};

// Function to play spooky sound
function playSpookySound() {
  const audio = new Audio("halloween-impact-05.mp3");
  audio.play();
}

// Function to show Halloween icon
function showHalloweenIcon() {
  const icon = document.getElementById("halloweenIcon");
  icon.style.display = "inline";
  setTimeout(() => {
    icon.style.display = "none";
  }, 4000);
}
// Functions to show and hide the loading screen
function showLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.style.display = "flex";
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.style.display = "none";
}

// Add event listener for the title link
document.getElementById("titleLink").addEventListener("click", (e) => {
  e.preventDefault();
  const body = document.body;

  if (body.classList.contains("dark-mode")) {
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
      console.log("Konami Code Activated");
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

function activateNeonMode() {
  document.body.classList.add("neon-mode");
}

// Add this new function
function initializeSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchInput.addEventListener("input", () => {
    displayContributors(searchInput.value);
  });

  searchButton.addEventListener("click", () => {
    displayContributors(searchInput.value);
  });
}

// Get the button element
const backToTopBtn = document.getElementById("backToTopBtn");

// Show the button when the user scrolls down 100px from the top
window.onscroll = function () {
  if (
    document.body.scrollTop > 100 ||
    document.documentElement.scrollTop > 100
  ) {
    backToTopBtn.style.display = "block";
  } else {
    backToTopBtn.style.display = "none";
  }
};

// Smooth scroll to the top when the button is clicked
backToTopBtn.addEventListener("click", function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Function to trigger the mascot animation
function showMascot() {
  const mascotContainer = document.getElementById("mascotContainer");
  const speechBubble = document.getElementById("speechBubble");

  // Show the mascot
  mascotContainer.style.display = "block";

  // Show the speech bubble after 1 second
  setTimeout(() => {
    speechBubble.style.visibility = "visible";
  }, 1000);

  // Hide the mascot and speech bubble after the animation finishes
  setTimeout(() => {
    mascotContainer.style.display = "none";
    speechBubble.style.visibility = "hidden";
  }, 5000); // Match this with the animation duration
}

// Search input to handle "Hacktober"
function initializeSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm === "hacktober") {
      showMascot(); // Trigger mascot animation when "hacktober" is typed
    }
    displayContributors(searchTerm);
  });

  searchButton.addEventListener("click", () => {
    displayContributors(searchInput.value);
  });
}
// JavaScript for triple-click Easter egg (flying Ghost)
    let clickCount = 0;
  
    // Select the title element
    const title = document.getElementById('titleLink');
    const ghost = document.getElementById('flyingGhost');
  
    // Add click event listener to the title
    title.addEventListener('click', () => {
      clickCount++;
  
      if (clickCount === 3) {
        // Show the ghost and start the animation
        ghost.style.display = 'block';
        ghost.style.animation = 'ghostFly 5s linear forwards';
  
        // Reset the click counter after the ghost finishes flying
        setTimeout(() => {
          clickCount = 0; // Reset click counter after animation
          ghost.style.display = 'none'; // Hide ghost again
        }, 5000); // Animation duration (5 seconds)
      }
    });

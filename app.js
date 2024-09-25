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
    wall.innerHTML = ""; // Clear the wall before adding new participants

    contributors.forEach((contributor) => {
        const div = document.createElement("div");
        div.classList.add("participant");
        div.textContent = contributor.name;
        wall.appendChild(div);
    });
}

// Function to Switch light/dark mode
function InitializeDarkMode() {
    const toggleButton = document.getElementById("toggleButton");
    const body = document.body;
    const elements = document.querySelectorAll('div, footer');

    // get from localstorage
    const isDarkMode = localStorage.getItem("dark-mode");

    if (isDarkMode === "enabled") {
        body.classList.add("dark-mode");
        elements.forEach(element => element.classList.add('dark-mode'));
        toggleButton.textContent = MOON;
    } else {
        toggleButton.textContent = SUN;
    }

    // set click event 
    toggleButton.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        elements.forEach(element => element.classList.toggle('dark-mode'));
        
        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("dark-mode", "enabled");
            toggleButton.textContent = MOON; 
        } else {
            localStorage.setItem("dark-mode", "disabled");
            toggleButton.textContent = SUN; 
        }
    });
}

// Initialize the wall with existing contributors
window.onload = function () {
    displayContributors();
    InitializeDarkMode();
};

// Function to load participants from the JSON file
async function loadContributors() {
    const response = await fetch('contributors.json');
    const contributors = await response.json();
    return contributors;
}

// Function to display participants on the mural
async function displayContributors() {
    const wall = document.getElementById('wall');
    const contributors = await loadContributors();
    wall.innerHTML = ''; // Clear the wall before adding new participants

    contributors.forEach(contributor => {
        const div = document.createElement('div');
        div.classList.add('participant');
        div.textContent = contributor.name;
        wall.appendChild(div);
    });
}

// Initialize the wall with existing contributors
window.onload = function() {
    displayContributors();
}
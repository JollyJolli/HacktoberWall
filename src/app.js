// Font Awesome classes for sun and moon
const MOON = '<i class="fas fa-moon"></i>';
const SUN = '<i class="fas fa-sun"></i>';
let toggleCount = 0; // Counter to track the number of clicks

// Function to load participants from the JSON file
async function loadContributors() {
	let contributors = null;
	showLoadingScreen();
	try {
		const response = await fetch('contributors.json');
		contributors = await response.json();
	} catch (error) {
		console.log(error);
	} finally {
		hideLoadingScreen();
	}
	return contributors;
}

// Function to display participants on the mural
async function displayContributors(filter = '') {
	const wall = document.getElementById('wall');
	const contributors = await loadContributors();
	wall.innerHTML = '';

	contributors.forEach((contributor, index) => {
		if (contributor.name.toLowerCase().includes(filter.toLowerCase())) {
			const div = document.createElement('div');
			div.classList.add('participant');
			div.textContent = contributor.name;
			div.style.animationDelay = `${index * 0.1}s`;
			wall.appendChild(div);
		}
	});
}

// Function to Switch light/dark mode
function initializeDarkMode() {
	const toggleButton = document.getElementById('toggleButton');
	const body = document.body;

	const isDarkMode = localStorage.getItem('dark-mode') === 'enabled';
	body.classList.toggle('dark-mode', isDarkMode);
	toggleButton.innerHTML = isDarkMode ? MOON : SUN;

	toggleButton.addEventListener('click', () => {
		body.classList.toggle('dark-mode');
		const isDarkMode = body.classList.contains('dark-mode');
		localStorage.setItem('dark-mode', isDarkMode ? 'enabled' : 'disabled');
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
	body.classList.add('rainbow-mode');

	// Remove rainbow mode after 10 seconds or adjust as needed
	setTimeout(() => {
		body.classList.remove('rainbow-mode');
	}, 5000);
}

function addParticipantHoverEffect() {
	const wall = document.getElementById('wall');
	wall.addEventListener('mouseover', (e) => {
		if (e.target.classList.contains('participant')) {
			e.target.style.transform = 'translateY(-5px)';
		}
	});
	wall.addEventListener('mouseout', (e) => {
		if (e.target.classList.contains('participant')) {
			e.target.style.transform = 'translateY(0)';
		}
	});
}

const funFacts = [
	'The first Hacktoberfest event was held in 2014.',
	'Hacktoberfest was created by DigitalOcean and GitHub.',
	"Open source software powers much of the internet's infrastructure.",
	"The term 'open source' was coined in 1998.",
	'Linux, the most famous open source project, was created in 1991.',
];

const sections = ['intro', 'wall-section', 'footer'];

function getRandomItem(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function showFunFact() {
	const fact = getRandomItem(funFacts);
	alert(fact);
}

function scrollToRandomSection() {
	const section = getRandomItem(sections);
	const element = document.querySelector(`.${section}`);
	element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleSurprise() {
	if (Math.random() < 0.5) {
		showFunFact();
	} else {
		scrollToRandomSection();
	}
}

function initializeSurpriseButton() {
	const surpriseButton = document.getElementById('surpriseButton');
	surpriseButton.addEventListener('click', handleSurprise);
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
// Functions to show and hide the loading screen
function showLoadingScreen() {
	const loadingScreen = document.getElementById('loading-screen');
	loadingScreen.style.display = 'flex';
}

function hideLoadingScreen() {
	const loadingScreen = document.getElementById('loading-screen');
	loadingScreen.style.display = 'none';
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

document.addEventListener('keydown', function (event) {
	if (event.keyCode === konamiCode[konamiIndex]) {
		konamiIndex++;
		if (konamiIndex === konamiCode.length) {
			activateNeonMode();
			console.log('Konami Code Activated');
			konamiIndex = 0;
		}
	} else {
		konamiIndex = 0;
	}
});

function activateNeonMode() {
	document.body.classList.add('neon-mode');
}

// Add this new function
function initializeSearch() {
	const searchInput = document.getElementById('searchInput');
	const searchButton = document.getElementById('searchButton');

	searchInput.addEventListener('input', () => {
		displayContributors(searchInput.value);
	});

	searchButton.addEventListener('click', () => {
		displayContributors(searchInput.value);
	});
}

// Get the button element
const backToTopBtn = document.getElementById('backToTopBtn');

// Show the button when the user scrolls down 100px from the top
window.onscroll = function () {
	if (
		document.body.scrollTop > 100 ||
		document.documentElement.scrollTop > 100
	) {
		backToTopBtn.style.display = 'block';
	} else {
		backToTopBtn.style.display = 'none';
	}
};

// Smooth scroll to the top when the button is clicked
backToTopBtn.addEventListener('click', function () {
	window.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
});

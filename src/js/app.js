// Font Awesome classes for sun and moon
const MOON = '<i class="fas fa-moon"></i>'
const SUN = '<i class="fas fa-sun"></i>'
const GHOST = '<i class="fas fa-ghost"></i>' // Halloween Icon
let toggleCount = 0 // Counter to track the number of clicks

let cachedContributors = null

// Const definitions for modal
const modal = document.querySelector('.modal')
const modalWrapper = document.querySelector('.modal-wrapper')
const modalContent = document.querySelector('.modal-content')
const modalClose = document.querySelector('.close-modal-button')
const contributerCount = document.querySelector('.total-contributors')

modalClose.addEventListener('click', closeModal)

function initializeThemeSwitching() {
  const toggleButton = document.getElementById('toggleButton')
  const body = document.body

  // Get the initial theme from local storage
  const currentTheme = localStorage.getItem('theme') || 'light-mode'
  body.classList.add(currentTheme)
  updateIcon(currentTheme, toggleButton)

  toggleButton.addEventListener('click', () => {
    toggleCount++
    if (toggleCount === 1) {
      body.classList.remove('light-mode', 'halloween-mode')
      body.classList.add('dark-mode')
      localStorage.setItem('theme', 'dark-mode')
      updateIcon('dark-mode', toggleButton)
    } else if (toggleCount === 2) {
      body.classList.remove('dark-mode', 'light-mode')
      body.classList.add('halloween-mode')
      localStorage.setItem('theme', 'halloween-mode')
      updateIcon('halloween-mode', toggleButton)
    } else {
      body.classList.remove('dark-mode', 'halloween-mode')
      body.classList.add('light-mode')
      localStorage.setItem('theme', 'light-mode')
      updateIcon('light-mode', toggleButton)
      toggleCount = 0
    }
  })
}

function flyInGhost() {
  const ghost = document.getElementById('flyingGhost')
  ghost.style.right = '100px' // Move it to the left side of the screen
}

function updateIcon(theme, toggleButton) {
  if (theme === 'dark-mode') {
    toggleButton.innerHTML = MOON
  } else if (theme === 'halloween-mode') {
    toggleButton.innerHTML = GHOST
  } else {
    toggleButton.innerHTML = SUN
  }
}

function checkHalloweenDate() {
  const today = new Date()
  if (today.getMonth() === 9 && today.getDate() === 31) {
    // October 31st
    document.body.classList.remove('light-mode', 'dark-mode')
    document.body.classList.add('halloween-mode')
    localStorage.setItem('theme', 'halloween-mode')
  }
}

// Function to load participants from the JSON file
async function loadContributors() {
  if (cachedContributors !== null) {
    return cachedContributors
  }

  let contributors = null
  showLoadingScreen()

  try {
    const response = await fetch('data/contributors.json')

    if (!response.ok) {
      throw new Error(
        `Failed to load contributors: HTTP status ${response.status} (${response.statusText})`
      )
    }

    contributors = await response.json()

    // Count the contributors
    const count = countItems(contributors)

    contributerCount.textContent = `Total: ${count}`

    cachedContributors = contributors
  } catch (error) {
    console.error('Error loading contributors:', error)
    alert(
      'Oops! Something went wrong while loading the contributors. Please try again later.\n\n' +
        'Error details: ' +
        error.message
    )
  } finally {
    hideLoadingScreen()
  }

  return contributors
}

// Helper function to count items in an object or array
function countItems(obj) {
  return Array.isArray(obj) ? obj.length : Object.keys(obj).length
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// Function to display participants on the wall
async function displayContributors(filter = '', sortOrder = 'default') {
  const wall = document.getElementById('wall')
  const contributors = await loadContributors()
  wall.innerHTML = ''

  shuffle(contributors)

  if (sortOrder === 'asc') {
    contributors.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortOrder === 'desc') {
    contributors.sort((a, b) => b.name.localeCompare(a.name))
  }

  contributors.forEach((contributor, index) => {
    if (contributor.name.toLowerCase().includes(filter.toLowerCase())) {
      const div = document.createElement('div')
      div.classList.add('participant')
      div.textContent = contributor.name
      div.style.animationDelay = `${index * 0.1}s`
      wall.appendChild(div)
    }
  })
}

// Initialize search and sort functionality
function initializeSearchAndSort() {
  const searchInput = document.getElementById('searchInput')
  const searchButton = document.getElementById('searchButton')
  const sortSelect = document.getElementById('sortSelect')

  searchInput.addEventListener('input', () => {
    displayContributors(searchInput.value, sortSelect.value)
  })

  searchButton.addEventListener('click', () => {
    displayContributors(searchInput.value, sortSelect.value)
  })

  sortSelect.addEventListener('change', () => {
    displayContributors(searchInput.value, sortSelect.value)
  })
}

// Function to switch light/dark mode
function initializeDarkMode() {
  const toggleButton = document.getElementById('toggleButton')
  const body = document.body

  const isDarkMode = localStorage.getItem('dark-mode') === 'enabled'
  body.classList.toggle('dark-mode', isDarkMode)
  toggleButton.innerHTML = isDarkMode ? MOON : SUN

  toggleButton.addEventListener('click', () => {
    body.classList.toggle('dark-mode')
    const isDarkMode = body.classList.contains('dark-mode')
    localStorage.setItem('dark-mode', isDarkMode ? 'enabled' : 'disabled')
    toggleButton.innerHTML = isDarkMode ? MOON : SUN

    toggleCount++

    if (toggleCount === 2) {
      activateRainbowMode()
      toggleCount = 0
    }
  })
}

function activateRainbowMode() {
  const body = document.body
  body.classList.add('rainbow-mode')

  setTimeout(() => {
    body.classList.remove('rainbow-mode')
  }, 5000)
}

function addParticipantHoverEffect() {
  const wall = document.getElementById('wall')
  wall.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('participant')) {
      e.target.style.transform = 'translateY(-5px)'
    }
  })
  wall.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('participant')) {
      e.target.style.transform = 'translateY(0)'
    }
  })
}

const funFacts = [
  'The first Hacktoberfest event was held in 2014.',
  'Hacktoberfest was created by DigitalOcean and GitHub.',
  "Open source software powers much of the internet's infrastructure.",
  "The term 'open source' was coined in 1998.",
  'Linux, the most famous open source project, was created in 1991.',
  'The Hacktoberfest Challenge is to have 4 open source contrubutions accepted, but you can do more.',
  'Particpating in Hacktoberfest is a great way to gain skills',
]

const sections = Array.from(document.querySelectorAll('section'))
let sectionsName = sections.map((section) => section.className)
for (let i = 0; i < sectionsName.length; i++) {
  sectionsName[i] = sectionsName[i].replace('section.', '')
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function showFunFact() {
  const fact = getRandomItem(funFacts)
  modal.setAttribute('aria-hidden', false)
  modal.setAttribute('aria-modal', true)
  modal.classList.remove('hidden')
  modalContent.textContent = fact
}

function closeModal() {
  modal.classList.add('hidden')
  modal.setAttribute('aria-hidden', true)
  modal.removeAttribute('aria-modal')
  modalContent.textContent = ''
}

window.onclick = function (event) {
  if (event.target === modal) {
    closeModal()
  }
}

function scrollToRandomSection() {
  const section = getRandomItem(sectionsName)
  const element = document.querySelector(`.${section}`)
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleSurprise() {
  if (Math.random() < 0.5) {
    showFunFact()
  } else {
    scrollToRandomSection()
  }
}

function initializeSurpriseButton() {
  const surpriseButton = document.getElementById('surpriseButton')
  surpriseButton.addEventListener('click', handleSurprise)
}

// Initialize the wall with existing contributors
window.onload = function () {
  displayContributors()
  initializeDarkMode()
  addParticipantHoverEffect()
  initializeSearchAndSort()
  initializeSurpriseButton()
  initializeThemeSwitching()
  checkHalloweenDate()
  if (document.body.classList.contains('halloween-mode')) {
    flyInGhost()
  }
}

// Functions to show and hide the loading screen
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen')
  loadingScreen.style.display = 'flex'
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen')
  loadingScreen.style.display = 'none'
}

// Get the button element
const backToTopBtn = document.getElementById('backToTopBtn')

// Show the button when the user scrolls down 100px from the top
window.onscroll = function () {
  if (
    document.body.scrollTop > 100 ||
    document.documentElement.scrollTop > 100
  ) {
    backToTopBtn.style.display = 'block'
  } else {
    backToTopBtn.style.display = 'none'
  }
}

// Smooth scroll to the top when the button is clicked
backToTopBtn.addEventListener('click', function () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
})

// Add event listener for the title link
document.getElementById('titleLink').addEventListener('click', (e) => {
  e.preventDefault()
  const body = document.body

  if (body.classList.contains('dark-mode')) {
    playSpookySound()
    showHalloweenIcon()
  }
})

SmoothScroll({
  animationTime: 800,
  stepSize: 75,
  accelerationDelta: 30,
  accelerationMax: 2,
  keyboardSupport: true,
  arrowScroll: 50,
  pulseAlgorithm: true,
  pulseScale: 4,
  pulseNormalize: 1,
  touchpadSupport: true,
})

var popup = document.getElementById('imagePopup')
var triggerImg = document.getElementById('triggerImage')
var popupImage = document.getElementById('popupImage')
var captionText = document.getElementById('caption')

// When the user clicks the trigger image, show a DIFFERENT image in the popup
triggerImg.onclick = function () {
  console.log('Trigger image clicked!')
  popup.style.display = 'flex' // Show the popup
  //popupImage.src = "./img/Angry_Pumpkin.jpg";
  captionText.innerHTML = 'Halloween is Coming!!!'
}

// Get the <span> element that closes the popup
var closeBtn = document.getElementsByClassName('close-btn')[0]

// When the user clicks on <span> (x), close the popup
closeBtn.onclick = function () {
  popup.style.display = 'none' // Hide the popup
}

const owners = [
  { name: "Jolly", username: "JollyJolli", elementId: "owner-jolly" },
  { name: "Phanty78", username: "Phanty78", elementId: "owner-phanty" },
];

async function fetchGitHubProfiles() {
  for (const owner of owners) {
      try {
          const response = await fetch(`https://api.github.com/users/${owner.username}`);
          if (!response.ok) {
              throw new Error(`Error fetching data: ${response.statusText}`);
          }
          const data = await response.json();
          const ownerElement = document.getElementById(owner.elementId);
          const profilePicture = ownerElement.querySelector(".profile-picture");
          profilePicture.src = data.avatar_url;
      } catch (error) {
          console.error("Failed to fetch profile:", error);
      }
  }
}

document.addEventListener("DOMContentLoaded", fetchGitHubProfiles);

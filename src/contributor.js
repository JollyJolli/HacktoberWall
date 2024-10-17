// Const Declaration
const contributorsContainer = document.querySelector('.contributors-container')

// Function to fetch contributors from GitHub API
async function fetchContributors() {
  const response = await fetch(
    'https://api.github.com/repos/JollyJolli/HacktoberWall/contributors'
  )
  const data = await response.json()
  return data
}

fetchContributors()
  .then((data) => {
    // Loop through each contributor and create a card
    data.forEach((contributor) => {
      const link = document.createElement('a')
      link.href = contributor.html_url
      link.target = '_blank'
      link.classList.add('contributors-link')
      const card = document.createElement('div')
      card.classList.add(
        'contributors-card',
        'wall',
        'participant',
        'wall-section'
      )
      card.innerHTML = `
        <div class="contributors-avatar-container">
            <img class="contributors-avatar" src="${contributor.avatar_url}" alt="${contributor.login}" loading="lazy" />
            <h3>${contributor.login}</h3>
        </div>
        <p class="contributors-contributions">${contributor.contributions} Contributions</p>
      `
      link.appendChild(card)
      contributorsContainer.appendChild(link)
    })
  })
  .catch((error) => {
    console.error('Error fetching contributors:', error)
  })

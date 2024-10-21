// Const Declaration
const contributorsContainer = document.querySelector('.contributors-container');

const fetchContributors = () => {
  return fetch('https://api.github.com/repos/JollyJolli/HacktoberWall/contributors')
      .then(response => {
        if(response.ok) return response.json();
          throw new Error(response.status);
      })
      .catch((error) => console.error('Error fetching contributors:', error));
}

const renderContributorList = async () => {
  const contributorList = await fetchContributors();
  contributorsContainer.innerHTML = contributorList.reduce(( list, user ) => {
    const { html_url, avatar_url, login, contributions } = user;
    return list += `<div class="contributors-card wall participant wall-section" data-url=${html_url}>
                      <div class="contributors-avatar-container">
                          <img class="contributors-avatar" src="${avatar_url}" alt="${login}" loading="lazy" />
                          <h4>${login}</h4>
                      </div>
                      <p class="contributors-contributions">${contributions} Contributions</p>
                    </div>`;
  }, '');
}

const showUserPage = ({ target }) => {
  const { url } = target.dataset;
  window.open(url, '_blank');
}

const init = () => {
  renderContributorList();
  contributorsContainer.addEventListener('click', showUserPage);
} 

init();
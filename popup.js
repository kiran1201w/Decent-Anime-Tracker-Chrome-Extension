document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const watchlistDiv = document.getElementById('watchlist');

  // Load watchlist from storage
  loadWatchlist();

  // Add event listener for dynamic search
  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    if (query) {
      // Delay the search to prevent too many API calls
      searchTimeout = setTimeout(() => {
        searchAnime(query);
      }, 300);
    } else {
      searchResults.innerHTML = '';
    }
  });

  function searchAnime(query) {
    const graphqlQuery = `
      query ($search: String) {
        Page(perPage: 5) {
          media(search: $search, type: ANIME) {
            id
            title {
              romaji
            }
            nextAiringEpisode {
              airingAt
              episode
            }
            coverImage {
              medium
            }
          }
        }
      }
    `;

    fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { search: query }
      })
    })
      .then(response => response.json())
      .then(data => {
        displaySearchResults(data.data.Page.media);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  function displaySearchResults(animeList) {
    searchResults.innerHTML = '';
    animeList.forEach(anime => {
      const animeDiv = document.createElement('div');
      animeDiv.className = 'anime-item';
      animeDiv.innerHTML = `
        <img src="${anime.coverImage.medium}" alt="${anime.title.romaji}">
        <div class="anime-info">
          <span>${anime.title.romaji}</span>
        </div>
        <button data-id="${anime.id}">Add</button>
      `;
      searchResults.appendChild(animeDiv);
    });

    // Add event listeners to 'Add' buttons
    document.querySelectorAll('#searchResults button').forEach(button => {
      button.addEventListener('click', addToWatchlist);
    });
  }

  function addToWatchlist(event) {
    const animeId = event.target.getAttribute('data-id');
    const button = event.target;
    button.disabled = true; // Prevent multiple clicks

    chrome.storage.local.get(['watchlist', 'notificationSettings'], (result) => {
      let watchlist = result.watchlist || [];
      let notificationSettings = result.notificationSettings || {};

      if (!watchlist.includes(animeId)) {
        watchlist.push(animeId);
        notificationSettings[animeId] = true; // Enable notifications by default

        chrome.storage.local.set({ watchlist, notificationSettings }, () => {
          loadWatchlist();
          button.disabled = false;
        });
      } else {
        button.disabled = false;
      }
    });
  }

  function loadWatchlist() {
    chrome.storage.local.get(['watchlist', 'notificationSettings'], (result) => {
      const watchlist = result.watchlist || [];
      const notificationSettings = result.notificationSettings || {};
      if (watchlist.length === 0) {
        watchlistDiv.innerHTML = '<p>No anime in your watchlist.</p>';
        return;
      }

      const graphqlQuery = `
        query ($ids: [Int]) {
          Page(perPage: 50) {
            media(id_in: $ids, type: ANIME) {
              id
              title {
                romaji
              }
              nextAiringEpisode {
                airingAt
                episode
              }
              coverImage {
                medium
              }
            }
          }
        }
      `;

      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { ids: watchlist.map(id => parseInt(id)) }
        })
      })
        .then(response => response.json())
        .then(data => {
          displayWatchlist(data.data.Page.media, notificationSettings);
        })
        .catch(error => {
          console.error('Error:', error);
        });
    });
  }

  function displayWatchlist(animeList, notificationSettings) {
    watchlistDiv.innerHTML = '';
    animeList.forEach(anime => {
      const animeDiv = document.createElement('div');
      animeDiv.className = 'anime-item';

      let nextEpisodeInfo = '';
      let countdownHTML = '';
      if (anime.nextAiringEpisode) {
        const airingAt = anime.nextAiringEpisode.airingAt * 1000; // Convert to milliseconds
        nextEpisodeInfo = `Next Ep ${anime.nextAiringEpisode.episode} airs in:`;

        // Assign a unique ID to the countdown element
        const countdownId = `countdown_${anime.id}`;

        countdownHTML = `<span id="${countdownId}" class="countdown"></span>`;

        // Start the countdown
        startCountdown(countdownId, airingAt);
      } else {
        nextEpisodeInfo = 'No upcoming episodes.';
      }

      // Determine notification status
      const notificationsEnabled = notificationSettings[anime.id] !== false; // Default to true

      animeDiv.innerHTML = `
        <img src="${anime.coverImage.medium}" alt="${anime.title.romaji}">
        <div class="anime-info">
          <span>${anime.title.romaji}</span>
          <small>${nextEpisodeInfo}</small>
          ${countdownHTML}
        </div>
        <div class="anime-actions">
          <button data-id="${anime.id}" class="remove-button">Remove</button>
          <button data-id="${anime.id}" class="notify-button">
            ${notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
          </button>
        </div>
      `;
      watchlistDiv.appendChild(animeDiv);
    });

    // Add event listeners to 'Remove' buttons
    document.querySelectorAll('.remove-button').forEach(button => {
      button.addEventListener('click', removeFromWatchlist);
    });

    // Add event listeners to 'Notify' buttons
    document.querySelectorAll('.notify-button').forEach(button => {
      button.addEventListener('click', toggleNotifications);
    });
  }

  function startCountdown(elementId, targetTime) {
    let intervalId; // Declare intervalId here

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance <= 0) {
        const countdownElement = document.getElementById(elementId);
        if (countdownElement) {
          countdownElement.innerHTML = "Airing now!";
        }
        clearInterval(intervalId);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor(
        (distance % (1000 * 60)) / 1000
      );

      let countdownText = '';
      if (days > 0) {
        countdownText += `${days}d `;
      }
      countdownText += `${hours}h ${minutes}m ${seconds}s`;

      const countdownElement = document.getElementById(elementId);
      if (countdownElement) {
        countdownElement.innerHTML = countdownText;
      } else {
        // Element might not exist if the anime was removed from the watchlist
        clearInterval(intervalId);
      }
    }

    // Update the countdown every second
    updateCountdown(); // Initial call to display immediately
    intervalId = setInterval(updateCountdown, 1000);
  }

  function removeFromWatchlist(event) {
    const animeId = event.target.getAttribute('data-id');
    chrome.storage.local.get(['watchlist', 'notificationSettings'], (result) => {
      let watchlist = result.watchlist || [];
      let notificationSettings = result.notificationSettings || {};

      watchlist = watchlist.filter(id => id !== animeId);
      delete notificationSettings[animeId];

      chrome.storage.local.set({ watchlist, notificationSettings }, () => {
        loadWatchlist();
      });
    });
  }

  function toggleNotifications(event) {
    const animeId = event.target.getAttribute('data-id');
    chrome.storage.local.get(['notificationSettings'], (result) => {
      let notificationSettings = result.notificationSettings || {};

      // Toggle the notification setting
      const currentSetting = notificationSettings[animeId];
      notificationSettings[animeId] = currentSetting === false ? true : false;

      chrome.storage.local.set({ notificationSettings }, () => {
        // Reload the watchlist to update the button text
        loadWatchlist();
      });
    });
  }
});

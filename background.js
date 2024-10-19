// Set an alarm to check for new episodes every hour
chrome.alarms.create('checkForNewEpisodes', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkForNewEpisodes') {
    checkForNewEpisodes();
  }
});

function checkForNewEpisodes() {
  chrome.storage.local.get(['watchlist', 'lastNotifiedEpisodes'], (result) => {
    const watchlist = result.watchlist || [];
    const lastNotifiedEpisodes = result.lastNotifiedEpisodes || {};

    if (watchlist.length === 0) {
      return;
    }

    const graphqlQuery = `
      query ($ids: [Int]) {
        Page(perPage: 10) {
          media(id_in: $ids, type: ANIME) {
            id
            title {
              romaji
            }
            nextAiringEpisode {
              airingAt
              episode
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
        const now = Math.floor(Date.now() / 1000);
        data.data.Page.media.forEach(anime => {
          const nextEpisode = anime.nextAiringEpisode;
          if (nextEpisode && nextEpisode.airingAt <= now) {
            const lastEpisode = lastNotifiedEpisodes[anime.id];
            if (lastEpisode !== nextEpisode.episode) {
              // Send notification
              chrome.notifications.create(`anime_${anime.id}`, {
                type: 'basic',
                title: `New Episode Released!`,
                message: `${anime.title.romaji} - Episode ${nextEpisode.episode} is now available.`,
                priority: 2
              });

              // Update last notified episode
              lastNotifiedEpisodes[anime.id] = nextEpisode.episode;
            }
          }
        });

        chrome.storage.local.set({ lastNotifiedEpisodes });
      })
      .catch(error => {
        console.error('Error:', error);
	window.sendEpisodeNotification = sendEpisodeNotification;
      });
  });
}

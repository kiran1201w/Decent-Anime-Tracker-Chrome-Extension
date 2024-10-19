Anime Tracker

Anime Tracker is a Chrome extension that helps you track your favorite anime shows and get notified when new episodes are released. The extension uses the AniList API to provide you with updates on upcoming and newly aired episodes.

Features
Search Anime: Search for any anime and add it to your watchlist.
Watchlist Management: View and manage your personalized watchlist.
Episode Notifications: Get notified when new episodes of your favorite anime are available.
Countdown Timer: See the countdown for the next episode airing time.
Customizable Notifications: Enable or disable notifications for specific anime.
Download
You can download and install the Anime Tracker extension directly from the Chrome Web Store:

Anime Tracker - Chrome Web Store

Screenshots

Installation
Clone or download this repository to your computer.
Open Chrome and navigate to chrome://extensions/.
Enable Developer Mode in the top right corner.
Click on Load unpacked and select the folder where you cloned/downloaded the repository.
The extension should now be visible in your extensions toolbar.
Usage
Click on the Anime Tracker icon in your browser to open the popup.
Use the search bar to find and add anime to your watchlist.
The watchlist will display all the anime you’re tracking.
Notifications will automatically appear when new episodes air.
Permissions
The extension requires the following permissions:

Storage: To store your watchlist and notification settings.
Notifications: To send you notifications when new episodes are released.
Alarms: To periodically check for new episodes.
Host Permissions: Access to https://graphql.anilist.co to fetch anime data from AniList.
How it Works
The extension sets an alarm that checks for new episodes every hour using AniList's API.
If a new episode is found, a notification is sent with the title and episode number.
Users can manage their watchlist and toggle notifications for each anime directly from the popup.
Development
To develop and modify the extension:

Make sure you have Node.js installed.
Edit the necessary files (popup.html, popup.js, background.js, styles.css, manifest.json).
Reload the extension in chrome://extensions/ after making any changes.
Contributing
Feel free to fork this repository, make enhancements, and submit pull requests. Any contributions are welcome!

License
This project is licensed under the MIT License.

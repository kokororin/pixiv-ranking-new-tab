import { fetchRanking } from './utils';

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'http://www.pixiv.net/ranking.php?mode=daily' });
});

const backgroundFetch = () => {
  fetchRanking().then(response => {
    const data = JSON.parse(response.responseText);
    if (data.illusts) {
      localStorage.setItem('ranking'.response.responseText);
    }
  });
};

backgroundFetch();

setInterval(() => {
  backgroundFetch();
}, 1000 * 60 * 10);

import { fetchRanking, showNotification } from './utils';

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'http://www.pixiv.net/ranking.php?mode=daily' });
});

const manifest = chrome.runtime.getManifest();
const previousVersion = localStorage.getItem('version');
if (previousVersion !== manifest.version) {
  localStorage.removeItem('ranking');
  localStorage.removeItem('ranking:date');
  localStorage.setItem('version', manifest.version);
}

const backgroundFetch = () => {
  fetchRanking().then(response => {
    const data = JSON.parse(response.responseText);
    if (data.status === 'success') {
      let rankingDate = localStorage.getItem('ranking:date');
      if (!rankingDate) {
        rankingDate = '2000-01-01';
      }
      if (
        new Date(rankingDate).getTime() < new Date(data.response.date).getTime()
      ) {
        localStorage.setItem('ranking', response.responseText);
        localStorage.setItem('ranking:date', data.response.date);
        showNotification({
          title: chrome.i18n.getMessage('appName'),
          message: chrome.i18n.getMessage('updated'),
          iconUrl: 'logo-128.png'
        });
      }
    }
  });
};

backgroundFetch();

setInterval(() => {
  backgroundFetch();
}, 1000 * 60 * 10);

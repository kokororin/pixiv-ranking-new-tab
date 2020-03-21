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
      let oldRanking = localStorage.getItem('ranking');
      try {
        oldRanking = JSON.parse(localStorage.getItem('ranking'));
      } catch (err) {
        oldRanking = { response: { illusts: [] } };
      }
      const oldIds = oldRanking.response.illusts.map(item => item.id);
      const newIds = data.response.illusts.map(item => item.id);

      if (
        oldIds.join(',') !== newIds.join(',')
      ) {
        localStorage.setItem('ranking', response.responseText);
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

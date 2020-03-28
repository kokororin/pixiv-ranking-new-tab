import { fetchRanking, showNotification } from './utils';

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://pixiv.moe/?entry=ranking' });
});

const manifest = chrome.runtime.getManifest();
const previousVersion = localStorage.getItem('version');
if (previousVersion !== manifest.version) {
  localStorage.removeItem('ranking');
  localStorage.setItem('version', manifest.version);
}

const backgroundFetch = () => {
  fetchRanking().then(response => {
    let data = {};
    try {
      data = JSON.parse(response.responseText);
    } catch (err) {
      data = { response: { illusts: [] } };
    }
    if (data.status === 'success') {
      let oldRanking = localStorage.getItem('ranking') || {
        response: { illusts: [] }
      };
      try {
        oldRanking = JSON.parse(localStorage.getItem('ranking'));
      } catch (err) {}
      const oldIds = oldRanking?.response?.illusts.map(item => item.id);
      const newIds = data?.response?.illusts.map(item => item.id);

      if (oldIds.join(',') !== newIds.join(',')) {
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

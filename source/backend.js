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

function backgroundFetch(ignoreCache = false) {
  let oldRanking = localStorage.getItem('ranking') || {
    code: 400
  };
  try {
    oldRanking = JSON.parse(oldRanking);
  } catch (err) {}

  if (oldRanking.code === 200 && !ignoreCache) {
    return Promise.resolve(oldRanking);
  }

  return new Promise((resolve, reject) => {
    fetchRanking().then(data => {
      if (!data) {
        data = { response: { illusts: [] } };
      }

      if (data.code === 200) {
        const oldDate = oldRanking?.response?.date;
        const newDate = data?.response?.date;

        if (oldDate !== newDate) {
          localStorage.setItem('ranking', JSON.stringify(data));
          showNotification({
            title: chrome.i18n.getMessage('appName'),
            message: chrome.i18n.getMessage('updated'),
            iconUrl: 'logo-128.png'
          });
        }

        resolve(data);
      } else {
        reject();
      }
    });
  });
}

backgroundFetch(true);

setInterval(() => {
  backgroundFetch(true);
}, 1000 * 60 * 10);

window.$backgroundFetch = backgroundFetch;

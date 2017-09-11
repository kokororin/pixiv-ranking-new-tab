chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.create({ url: 'http://www.pixiv.net/ranking.php?mode=daily' });
});

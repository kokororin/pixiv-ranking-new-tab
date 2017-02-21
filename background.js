chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({ url: 'http://www.pixiv.net/ranking.php?mode=daily' });
});

export function fetchRanking() {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://api.pixiv.moe/v2/ranking', true);
    request.onload = () => {
      resolve(request);
    };
    request.onerror = () => {
      reject();
    };
    request.send();
  });
}

export function showNotification(opt, time) {
  if (typeof time === 'undefined') {
    time = 5000;
  }
  opt.type = opt.type || 'basic';
  chrome.notifications.clear('notifyId');
  const notification = chrome.notifications.create(
    'notifyId',
    opt,
    notifyId => {
      return notifyId;
    }
  );
  setTimeout(() => {
    chrome.notifications.clear('notifyId');
  }, time);
  return notification;
}

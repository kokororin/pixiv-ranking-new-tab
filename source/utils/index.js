export function fetchRanking() {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://api.pixiv.moe/v1/ranking', true);
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

export function cutString(str, len) {
  if (str.length * 2 <= len) {
    return str;
  }
  let strlen = 0;
  let s = '';
  for (let i = 0; i < str.length; i++) {
    s = s + str.charAt(i);
    if (str.charCodeAt(i) > 128) {
      strlen = strlen + 2;
      if (strlen >= len) {
        return s.substring(0, s.length - 1) + '...';
      }
    } else {
      strlen = strlen + 1;
      if (strlen >= len) {
        return s.substring(0, s.length - 2) + '...';
      }
    }
  }
  return s;
}

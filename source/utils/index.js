export function session() {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://api.pixiv.moe/session', true);
    request.onload = () => {
      resolve(request);
    };
    request.onerror = () => {
      reject();
    };
    request.send();
  });
}

export function fetchRanking() {
  return new Promise((resolve, reject) => {
    session().then(resp => {
      if (resp.status >= 200 && resp.status < 400) {
        const sessionData = JSON.parse(resp.responseText);
        if (sessionData.code === 200) {
          const request = new XMLHttpRequest();
          request.open(
            'GET',
            'https://api.pixiv.moe/ranking?source=extension',
            true
          );
          request.setRequestHeader(
            'X-Kotori-Token',
            sessionData.response.access_token
          );
          request.onload = () => {
            resolve(request);
          };
          request.onerror = () => {
            reject();
          };
          request.send();
        } else {
          reject();
        }
      }
    });
  });
}

export function showNotification(opt, time = 5000) {
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

export function getProxyImage(url) {
  const regex = /^http?s:\/\/i\.pximg\.net/i;
  if (regex.test(url)) {
    return `https://api.pixiv.moe/image/${url.replace(/^http?s:\/\//, '')}`;
  }
  return url;
}

const defaultOptions = {
  showProgress: true,
  intervalTime: 6500
};

export function setOption(key, value) {
  let options = localStorage.getItem('options') || '{}';
  options = JSON.parse(options);
  options = { ...defaultOptions, ...options };
  options[key] = value;
  localStorage.setItem('options', JSON.stringify(options));
}

export function getOption(key) {
  let options = localStorage.getItem('options') || '{}';
  options = JSON.parse(options);
  options = { ...defaultOptions, ...options };
  if (!key) {
    return options;
  }
  return options[key];
}

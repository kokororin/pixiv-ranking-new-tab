(function() {
  'use strict';
  var request = new XMLHttpRequest();
  var data = null;
  var index = 0;
  var cutString = function(str, len) {
    if (str.length * 2 <= len) {
      return str;
    }
    var strlen = 0;
    var s = "";
    for (var i = 0; i < str.length; i++) {
      s = s + str.charAt(i);
      if (str.charCodeAt(i) > 128) {
        strlen = strlen + 2;
        if (strlen >= len) {
          return s.substring(0, s.length - 1) + "...";
        }
      } else {
        strlen = strlen + 1;
        if (strlen >= len) {
          return s.substring(0, s.length - 2) + "...";
        }
      }
    }
    return s;
  };
  var carousel = function() {
    var works = data.response.works;
    var val = works[index];
    document.querySelector('body').style.backgroundImage = 'url(https://api.pixiv.moe/v1/ranking/' + val.rank + ')';
    var footerWidth = document.querySelector('.footer').offsetWidth;
    var rankWidth = document.querySelector('.footer .rank').offsetWidth;
    var cutLength = Math.ceil((Math.ceil((footerWidth - rankWidth) / 40) * 1.3));
    document.querySelector('.footer .title').innerHTML = '<a href="http://www.pixiv.net/i/' + val.work.id + '">' + cutString(val.work.title, cutLength) + '</a>';
    var rankHTML = val.rank + '位';
    rankHTML += '<div class="yesterday">';
    if (val.previous_rank === 0) {
      rankHTML += '初登場';
    } else if (val.previous_rank > val.rank) {
      rankHTML += '<span class="compare">↑</span> ' + '前日 ' + val.previous_rank + '位';
    } else if (val.previous_rank < val.rank) {
      rankHTML += '<span class="compare">↓</span> ' + '前日 ' + val.previous_rank + '位';
    }
    rankHTML += '</div>';
    document.querySelector('.footer .rank').innerHTML = rankHTML
    index++;
    if (index >= works.length) {
      index = 0;
    }
  };
  var showError = function() {
    document.querySelector('.footer .title').innerHTML = '<a href="#" id="reload">読み込みに失敗しました</a>';
    document.querySelector('#reload').addEventListener('click', function(event) {
      event.preventDefault();
      localStorage.removeItem('ranking');
      localStorage.removeItem('ranking:ts');
      window.location.reload();
    });
  };
  var processRequest = function() {
    if (this.status >= 200 && this.status < 400) {
      data = JSON.parse(this.responseText);

      if (data.status === 'success') {
        carousel();
        setInterval(carousel, 5000);
        localStorage.setItem('ranking', this.responseText);
        localStorage.setItem('ranking:ts', new Date().getTime() + 3600 * 3 * 1000);
      }
    } else {
      showError();
    }
  };

  data = localStorage.getItem('ranking');
  var expire = localStorage.getItem('ranking:ts');
  if ((data === null && expire === null)
    || new Date().getTime() >= expire) {
    request.open('GET', 'https://api.pixiv.moe/v1/ranking', true);
    request.onload = processRequest;
    request.onerror = showError;
    request.send();
  } else {
    var cachedRequest = {
      status: 200,
      responseText: data
    };
    processRequest.call(cachedRequest);
  }

  for (var i = 0, l = document.querySelectorAll('.chrome-link').length; i < l; i++) {
    var element = document.querySelectorAll('.chrome-link')[i];
    element.innerHTML = chrome.i18n.getMessage(element.dataset.name);
    element.addEventListener('click', function(event) {
      event.preventDefault();
      chrome.tabs.update({
        url: this.dataset.url
      });
    });
  }

})();
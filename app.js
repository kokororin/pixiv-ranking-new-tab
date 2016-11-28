// The MIT License (MIT)

// Copyright (c) 2016 Kokororin (https://kotori.love)

// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included 
// in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
var App = (function() {
  'use strict';
  return {
    data: null,
    index: 0,
    interValTime: 6500,
    tokyoTimeZone: 'Asia/Tokyo',

    run: function() {
      this.renderChromeLink();
      this.render();
    },

    renderChromeLink: function() {
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
    },

    render: function() {
      this.data = localStorage.getItem('ranking');
      var cachedDate = localStorage.getItem('ranking:date');
      var tokyoDate = moment().tz(this.tokyoTimeZone).format('YYYY-MM-DD'); // 2016-11-28
      var updateDate = tokyoDate + 'T12:30:00+09:00'; // 2016-11-28T12:30:00+09:00
      updateDate = moment(updateDate).tz(this.tokyoTimeZone);
      var nowDate = moment().tz(this.tokyoTimeZone);

      var shouldUpdate = false;
      if (this.data === null && cachedDate === null) {
        shouldUpdate = true;
      } else {
        if (cachedDate === moment(tokyoDate, 'YYYY-MM-DD').add('-1', 'days').format('YYYY-MM-DD')) {
          shouldUpdate = false;
        } else if (nowDate.isAfter(updateDate)) {
          shouldUpdate = true;
        } else {
          shouldUpdate = false;
        }
      }

      if (shouldUpdate) {
        var request = new XMLHttpRequest();
        request.open('GET', 'https://api.pixiv.moe/v1/ranking', true);
        request.onload = function() {
          this.processResponse(request);
          this.showNotification({
            title: chrome.i18n.getMessage('appName'),
            message: chrome.i18n.getMessage('updated'),
            iconUrl: 'logo-128.png'
          });
        }.bind(this);
        request.onerror = this.showError;
        request.send();
      } else {
        var cachedRequest = {
          status: 200,
          responseText: this.data
        };
        this.processResponse(cachedRequest);
      }
    },

    cutString: function(str, len) {
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
    },

    carousel: function() {
      var works = this.data.response.works;
      var val = works[this.index];
      document.querySelector('body').style.backgroundImage = 'url(https://api.pixiv.moe/v1/ranking/' + val.rank + ')';
      var footerWidth = document.querySelector('.footer').offsetWidth;
      var rankWidth = document.querySelector('.footer .rank').offsetWidth;
      var cutLength = Math.ceil((Math.ceil((footerWidth - rankWidth) / 40) * 1.3));
      document.querySelector('.footer .title').innerHTML = '<a href="http://www.pixiv.net/i/' + val.work.id + '">' + this.cutString(val.work.title, cutLength) + '</a>';
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
      this.index++;
      if (this.index >= works.length) {
        this.index = 0;
      }
    },

    showError: function() {
      document.querySelector('.footer .title').innerHTML = '<a href="#" id="reload">読み込みに失敗しました</a>';
      document.querySelector('#reload').addEventListener('click', function(event) {
        event.preventDefault();
        localStorage.removeItem('ranking');
        localStorage.removeItem('ranking:date');
        window.location.reload();
      });
    },

    showNotification: function(opt, time) {
      if (typeof time === 'undefined') {
        time = 5000;
      }
      opt.type = opt.type || 'basic';
      chrome.notifications.clear('notifyId');
      var notification = chrome.notifications.create('notifyId', opt, function(notifyId) {
        return notifyId;
      });
      setTimeout(function() {
        chrome.notifications.clear('notifyId');
      }, time);
      return notification;
    },

    processResponse: function(o) {
      if (o.status >= 200 && o.status < 400) {
        this.data = JSON.parse(o.responseText);

        if (this.data.status === 'success') {
          this.carousel();
          setInterval(this.carousel.bind(this), this.interValTime);
          localStorage.setItem('ranking', o.responseText);
          localStorage.setItem('ranking:date', this.data.response.date);
        }
      } else {
        this.showError();
      }
    }
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  App.run();
});

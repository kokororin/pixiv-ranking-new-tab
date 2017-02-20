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
'use strict';
var App = React.createClass({
  displayName: 'AppComponent',

  config: {
    interValTime: 6500,
    tokyoTimeZone: 'Asia/Tokyo',
    rankingAPI: 'https://api.pixiv.moe/v1/ranking',
    menuItems: [{
      i18nString: 'update',
      onClick: function() {
        this.onUpdateClick();
      }
    }, {
      i18nString: 'history',
      onClick: function() {
        this.openChromeLink('chrome://history')
      }
    }, {
      i18nString: 'bookmarks',
      onClick: function() {
        this.openChromeLink('chrome://bookmarks')
      }
    }, {
      i18nString: 'apps',
      onClick: function() {
        this.openChromeLink('chrome://apps')
      }
    }]
  },

  getInitialState: function() {
    return {
      response: null,
      index: 0,
      item: {},
      progressPercent: 0
    };
  },

  componentWillMount: function() {
    var manifest = chrome.runtime.getManifest();
    var previousVersion = localStorage.getItem('version');
    if (previousVersion !== manifest.version) {
      localStorage.removeItem('ranking');
      localStorage.removeItem('ranking:date');
      localStorage.setItem('version', manifest.version);
    }
  },

  componentDidMount: function() {
    var data = localStorage.getItem('ranking');
    var cachedDate = localStorage.getItem('ranking:date');
    var tokyoDate = moment().tz(this.config.tokyoTimeZone).format('YYYY-MM-DD'); // 2016-11-28
    var updateDate = tokyoDate + 'T12:30:00+09:00'; // 2016-11-28T12:30:00+09:00
    updateDate = moment(updateDate).tz(this.config.tokyoTimeZone);
    var nowDate = moment().tz(this.config.tokyoTimeZone);
    var shouldUpdate = false;

    if (data === null && cachedDate === null) {
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
      request.open('GET', this.config.rankingAPI, true);
      request.onload = function() {
        this.processResponse(request);
        this.showNotification({
          title: chrome.i18n.getMessage('appName'),
          message: chrome.i18n.getMessage('updated'),
          iconUrl: 'logo-128.png'
        });
      }.bind(this);
      request.onerror = this.setError;
      request.send();
    } else {
      var cachedRequest = {
        status: 200,
        responseText: data
      };
      this.processResponse(cachedRequest);
    }
  },

  processResponse: function(o) {
    if (o.status >= 200 && o.status < 400) {
      var data = JSON.parse(o.responseText);

      if (data.status === 'success') {
        this.setState({
          response: data.response
        }, function() {
          this.carousel();
          setInterval(this.carousel.bind(this), this.config.interValTime);
        });
        localStorage.setItem('ranking', o.responseText);
        localStorage.setItem('ranking:date', data.response.date);
      }
    } else {
      this.setError();
    }
  },

  carousel: function() {
    var works = this.state.response.works;
    var val = works[this.state.index];

    document.body.style.backgroundImage = 'url(' + val.work.image_urls.large + ')';
    var footerWidth = this.footerRef.offsetWidth;
    var rankWidth = this.rankRef.offsetWidth;
    var cutLength = Math.ceil((Math.ceil((footerWidth - rankWidth) / 40) * 1.3));
    this.setItem('title', this.cutString(val.work.title, cutLength));
    this.setItem('url', 'http://www.pixiv.net/i/' + val.work.id);
    this.setItem('rankNum', val.rank + '位');
    var icon;
    if (val.previous_rank === 0) {
      this.setItem('rankMetaText', '初登場');
      this.setItem('rankMetaIcon', null);
    } else {
      this.setItem('rankMetaText', '前日 ' + val.previous_rank + '位');
      if (val.previous_rank > val.rank) {
        icon = '↑';
      } else if (val.previous_rank < val.rank) {
        icon = '↓';
      }
      this.setItem('rankMetaIcon', React.createElement('span', {
        className: 'compare'
      }, icon));
    }

    var startTime = new Date().getTime();
    if (typeof this.progressTimer !== 'undefined') {
      clearInterval(this.progressTimer);
    }

    this.progressTimer = setInterval(function() {
      var nowTime = new Date().getTime();
      var eclipseTime = nowTime - startTime;
      var progressPercent = eclipseTime / this.config.interValTime * 100;
      this.setState({
        progressPercent: progressPercent
      });
    }.bind(this), 100);

    this.setState({
      index: this.state.index >= (works.length - 1) ? 0 : (this.state.index + 1)
    });
  },

  openChromeLink: function(url) {
    chrome.tabs.update({
      url: url
    });
  },

  onUpdateClick: function() {
    localStorage.removeItem('ranking');
    localStorage.removeItem('ranking:date');
    window.location.reload();
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

  setItem: function(key, value) {
    var item = this.state.item;
    item[key] = value;
    this.setState({
      item: item
    });
  },

  getItem: function(key) {
    return this.state.item[key];
  },

  setError: function() {
    this.setState({
      isError: true
    });
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

  renderTitleContent: function() {
    if (this.state.isError) {
      return this.renderError();
    }
    if (this.state.response === null) {
      return null;
    }
    return React.createElement('a', {
      href: this.getItem('url')
    }, this.getItem('title'));
  },

  renderRankContent: function() {
    if (this.state.response === null) {
      return null;
    }
    return React.createElement('div', {
      ref: function(ref) {
        this.rankRef = ref;
      }.bind(this),
      className: 'rank'
    }, this.getItem('rankNum'), React.createElement('div', {
      className: 'yesterday'
    }, this.getItem('rankMetaIcon'), this.getItem('rankMetaText')));
  },

  renderError: function() {
    return React.createElement('a', {
      href: '#',
      onClick: function(event) {
        event.nativeEvent.preventDefault();
        localStorage.removeItem('ranking');
        localStorage.removeItem('ranking:date');
        window.location.reload();
      }
    }, '読み込みに失敗しました');
  },

  render: function() {
    return React.createElement('div', null, React.createElement('div', {
      id: 'top-right',
      className: 'right'
    }, React.createElement('div', {
      id: 'top-menu'
    }, React.createElement('ul', {
      className: 'nav navbar-nav navbar-right'
    }, this.config.menuItems.map(function(elem) {
      return React.createElement(
        'li', null, React.createElement('a', {
          href: '#',
          onClick: elem.onClick.bind(this)
        }, chrome.i18n.getMessage(elem.i18nString))
      );
    }.bind(this))))), React.createElement(Progress, {
      speed: 0.05,
      percent: this.state.progressPercent
    }), React.createElement('footer', {
      ref: function(ref) {
        this.footerRef = ref;
      }.bind(this),
      className: 'footer'
    }, React.createElement('div', {
      className: 'title'
    }, this.renderTitleContent()), this.renderRankContent()));
  }

});

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(React.createElement(App), document.querySelector('#app'));
});

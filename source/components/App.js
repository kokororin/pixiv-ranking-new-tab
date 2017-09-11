import React from 'react';
import moment from 'moment';
import momentLocale from 'moment/locale/ja';
import 'moment-timezone';
import Progress from 'react-progress';

moment.updateLocale('ja', momentLocale);

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
      index: 0,
      item: {},
      progressPercent: 0
    };
  }

  componentWillMount() {
    document.title = chrome.i18n.getMessage('newTab');
    const manifest = chrome.runtime.getManifest();
    const previousVersion = localStorage.getItem('version');
    if (previousVersion !== manifest.version) {
      localStorage.removeItem('ranking');
      localStorage.removeItem('ranking:date');
      localStorage.setItem('version', manifest.version);
    }
  }

  componentDidMount() {
    const data = localStorage.getItem('ranking');
    const cachedDate = localStorage.getItem('ranking:date');
    const tokyoDate = moment()
      .tz(this.config.tokyoTimeZone)
      .format('YYYY-MM-DD'); // 2016-11-28
    let updateDate = tokyoDate + 'T12:30:00+09:00'; // 2016-11-28T12:30:00+09:00
    updateDate = moment(updateDate).tz(this.config.tokyoTimeZone);
    const nowDate = moment().tz(this.config.tokyoTimeZone);
    let shouldUpdate = false;

    if (data === null && cachedDate === null) {
      shouldUpdate = true;
    } else {
      if (
        cachedDate ===
        moment(tokyoDate, 'YYYY-MM-DD')
          .add('-1', 'days')
          .format('YYYY-MM-DD')
      ) {
        shouldUpdate = false;
      } else if (nowDate.isAfter(updateDate)) {
        shouldUpdate = true;
      } else {
        shouldUpdate = false;
      }
    }

    if (shouldUpdate) {
      const request = new XMLHttpRequest();
      request.open('GET', this.config.rankingAPI, true);
      request.onload = () => {
        this.processResponse(request);
        this.showNotification({
          title: chrome.i18n.getMessage('appName'),
          message: chrome.i18n.getMessage('updated'),
          iconUrl: 'logo-128.png'
        });
      };
      request.onerror = this.setError;
      request.send();
    } else {
      const cachedRequest = {
        status: 200,
        responseText: data
      };
      this.processResponse(cachedRequest);
    }
  }

  config = {
    interValTime: 6500,
    tokyoTimeZone: 'Asia/Tokyo',
    rankingAPI: 'https://api.pixiv.moe/v1/ranking',
    menuItems: [
      {
        i18nString: 'update',
        onClick: () => {
          this.onUpdateClick();
        }
      },
      {
        i18nString: 'history',
        onClick: () => {
          this.openChromeLink('chrome://history');
        }
      },
      {
        i18nString: 'bookmarks',
        onClick: () => {
          this.openChromeLink('chrome://bookmarks');
        }
      },
      {
        i18nString: 'apps',
        onClick: () => {
          this.openChromeLink('chrome://apps');
        }
      }
    ]
  };

  processResponse(o) {
    if (o.status >= 200 && o.status < 400) {
      const data = JSON.parse(o.responseText);

      if (data.status === 'success') {
        this.setState(
          {
            response: data.response
          },
          () => {
            this.carousel();
            setInterval(this.carousel, this.config.interValTime);
          }
        );
        localStorage.setItem('ranking', o.responseText);
        localStorage.setItem('ranking:date', data.response.date);
      }
    } else {
      this.setError();
    }
  }

  carousel = () => {
    const works = this.state.response.works;
    const val = works[this.state.index];

    document.body.style.backgroundImage =
      'url(' + val.work.image_urls.large + ')';
    const footerWidth = this.footerRef.offsetWidth;
    const rankWidth = this.rankRef.offsetWidth;
    const cutLength = Math.ceil(
      Math.ceil((footerWidth - rankWidth) / 40) * 1.3
    );
    this.setItem('title', this.cutString(val.work.title, cutLength));
    this.setItem('url', 'http://www.pixiv.net/i/' + val.work.id);
    this.setItem('rankNum', val.rank + '位');
    let icon;
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
      this.setItem('rankMetaIcon', <span className="compare">{icon}</span>);
    }

    const startTime = new Date().getTime();
    if (typeof this.progressTimer !== 'undefined') {
      clearInterval(this.progressTimer);
    }

    this.progressTimer = setInterval(() => {
      const nowTime = new Date().getTime();
      const eclipseTime = nowTime - startTime;
      const progressPercent = eclipseTime / this.config.interValTime * 100;
      this.setState({
        progressPercent
      });
    }, 100);

    this.setState({
      index: this.state.index >= works.length - 1 ? 0 : this.state.index + 1
    });
  };

  openChromeLink(url) {
    chrome.tabs.update({
      url
    });
  }

  onUpdateClick = () => {
    localStorage.removeItem('ranking');
    localStorage.removeItem('ranking:date');
    window.location.reload();
  };

  showNotification(opt, time) {
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

  setItem(key, value) {
    const item = this.state.item;
    item[key] = value;
    this.setState({
      item
    });
  }

  getItem(key) {
    return this.state.item[key];
  }

  setError() {
    this.setState({
      isError: true
    });
  }

  cutString(str, len) {
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

  renderTitleContent() {
    if (this.state.isError) {
      return this.renderError();
    }
    if (this.state.response === null) {
      return null;
    }
    return <a href={this.getItem('url')}>{this.getItem('title')}</a>;
  }

  renderRankContent() {
    if (this.state.response === null) {
      return null;
    }
    return (
      <div ref={ref => (this.rankRef = ref)} className="rank">
        {this.getItem('rankNum')}
        <div className="yesterday">
          {this.getItem('rankMetaIcon')}
          {this.getItem('rankMetaText')}
        </div>
      </div>
    );
  }

  renderError() {
    return (
      <a
        href="#"
        onClick={event => {
          event.nativeEvent.preventDefault();
          localStorage.removeItem('ranking');
          localStorage.removeItem('ranking:date');
          window.location.reload();
        }}>
        読み込みに失敗しました
      </a>
    );
  }

  render() {
    return (
      <div>
        <div id="top-right" className="right">
          <div id="top-menu">
            <ul className="nav navbar-nav navbar-right">
              {this.config.menuItems.map((elem, index) => (
                <li key={index}>
                  <a href="#" onClick={elem.onClick}>
                    {chrome.i18n.getMessage(elem.i18nString)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Progress speed={0.05} percent={this.state.progressPercent} />
        <footer ref={ref => (this.footerRef = ref)} className="footer">
          <div className="title">{this.renderTitleContent()}</div>
          {this.renderRankContent()}
        </footer>
      </div>
    );
  }
}

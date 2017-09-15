import React from 'react';
import Progress from 'react-progress';

import { fetchRanking } from '../utils';

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
      localStorage.setItem('version', manifest.version);
    }
  }

  componentDidMount() {
    const data = localStorage.getItem('ranking');
    if (!data) {
      fetchRanking()
        .then(request => {
          this.processResponse(request);
        })
        .catch(() => {
          this.setError();
        });
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

      if (data.illusts) {
        this.setState({ response: data }, () => {
          this.carousel();
          setInterval(this.carousel, this.config.interValTime);
        });
        localStorage.setItem('ranking', o.responseText);
      }
    } else {
      this.setError();
    }
  }

  carousel = () => {
    const works = this.state.response.illusts;
    const val = works[this.state.index];
    document.body.style.backgroundImage = 'url(' + val.image_urls.large + ')';
    const footerWidth = this.footerRef.offsetWidth;
    const rankWidth = this.rankRef.offsetWidth;
    const cutLength = Math.ceil(
      Math.ceil((footerWidth - rankWidth) / 40) * 1.3
    );
    this.setItem('title', this.cutString(val.title, cutLength));
    this.setItem('url', 'http://www.pixiv.net/i/' + val.id);
    this.setItem('rankNum', this.state.index + 1 + '位');

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
    window.location.reload();
  };

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
      </div>
    );
  }

  renderError() {
    return (
      <a
        href="#"
        onClick={event => {
          event.preventDefault();
          localStorage.removeItem('ranking');
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

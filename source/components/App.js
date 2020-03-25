import React from 'react';
import Progress from 'react-progress';
import MDSpinner from 'react-md-spinner';
import Favorite from './Favorite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faRedo,
  faPause
} from '@fortawesome/free-solid-svg-icons';

import { fetchRanking, cutString, getProxyImage } from '../utils';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
      index: 0,
      item: {},
      progressPercent: 0,
      isError: false,
      isLoading: true
    };
  }

  componentDidMount() {
    document.title = chrome.i18n.getMessage('newTab');
    const data = localStorage.getItem('ranking');
    if (!data) {
      fetchRanking()
        .then(request => {
          this.processResponse(request);
        })
        .catch(err => {
          console.error(err);
          this.setError();
        })
        .finally(() => {
          this.setState({ isLoading: false });
        });
    } else {
      this.setState({ isLoading: false });
      const cachedRequest = {
        status: 200,
        responseText: data
      };
      this.processResponse(cachedRequest);
    }
  }

  config = {
    interValTime: 6500,
    actionItems: [
      {
        icon: faChevronLeft
      },
      {
        icon: faChevronRight
      },
      {
        icon: faRedo
      },
      {
        icon: faPause
      }
    ],
    menuItems: [
      {
        i18nString: 'history',
        onClick: event => {
          event.preventDefault();
          this.openChromeLink('chrome://history');
        }
      },
      {
        i18nString: 'bookmarks',
        onClick: event => {
          event.preventDefault();
          this.openChromeLink('chrome://bookmarks');
        }
      },
      {
        i18nString: 'apps',
        onClick: event => {
          event.preventDefault();
          this.openChromeLink('chrome://apps');
        }
      }
    ]
  };

  processResponse(o) {
    if (o.status >= 200 && o.status < 400) {
      const data = JSON.parse(o.responseText);

      if (data.status === 'success') {
        this.setState({ response: data.response }, () => {
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
    document.body.style.backgroundImage =
      'url(' + getProxyImage(val.image_urls.large) + ')';
    const footerWidth = this.footerRef.offsetWidth;
    const rankWidth = this.rankRef.offsetWidth;
    const cutLength = Math.ceil(
      Math.ceil((footerWidth - rankWidth) / 40) * 1.3
    );
    this.setItem('title', cutString(val.title, cutLength));
    this.setItem('url', 'https://pixiv.moe/' + val.id);
    this.setItem(
      'rankNum',
      chrome.i18n.getMessage('rankNum', [this.state.index + 1])
    );
    this.setItem(
      'rankMetaText',
      <>
        <Favorite />
        {val.total_bookmarks}
      </>
    );

    const startTime = new Date().getTime();
    if (typeof this.progressTimer !== 'undefined') {
      clearInterval(this.progressTimer);
    }

    this.progressTimer = setInterval(() => {
      const nowTime = new Date().getTime();
      const eclipseTime = nowTime - startTime;
      const progressPercent = (eclipseTime / this.config.interValTime) * 100;
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

  openLink(url) {
    location.href = url;
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

  renderTitleContent() {
    if (this.state.isError) {
      return this.renderError();
    }
    if (this.state.response === null) {
      return null;
    }
    return (
      <a
        href="#"
        onClick={event => {
          event.preventDefault();
          this.openLink(this.getItem('url'));
        }}>
        {this.getItem('title')}
      </a>
    );
  }

  renderRankContent() {
    if (this.state.response === null) {
      return null;
    }
    return (
      <div ref={ref => (this.rankRef = ref)} className="rank">
        {this.getItem('rankNum')}
        <div className="meta">{this.getItem('rankMetaText')}</div>
      </div>
    );
  }

  renderError() {
    return (
      <a
        href="#"
        onClick={event => {
          event.preventDefault();
          this.onUpdateClick();
        }}>
        {chrome.i18n.getMessage('loadFailed')}
      </a>
    );
  }

  render() {
    return (
      <>
        <div className="top left">
          <div className="top-menu">
            <ul className="nav navbar-nav navbar-right">
              {this.config.actionItems.map((elem, index) => (
                <li key={index}>
                  <a href="#" onClick={elem.onClick}>
                    <FontAwesomeIcon icon={elem.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="top right">
          <div className="top-menu">
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
        {this.state.isLoading ? (
          <div className="loading-spinner">
            <MDSpinner size={40} />
          </div>
        ) : (
          <Progress
            speed={0.07}
            percent={this.state.progressPercent}
            style={{ boxShadow: 'none' }}
          />
        )}

        <footer ref={ref => (this.footerRef = ref)} className="footer">
          <div className="title">{this.renderTitleContent()}</div>
          {this.renderRankContent()}
        </footer>
      </>
    );
  }
}

import React from 'react';
import ReactDOM from 'react-dom';
import Progress from 'react-progress';
import MDSpinner from 'react-md-spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faPause,
  faPlay,
  faHeart,
  faHistory,
  faBookmark,
  faRocket,
  faFileDownload
} from '@fortawesome/free-solid-svg-icons';
import SafeAnchor from '../components/SafeAnchor';
import { fetchRanking, cutString, getProxyImage, getOption } from '../utils';
import '../styles/main.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
      index: 0,
      item: {},
      progressPercent: 0,
      isError: false,
      isLoading: true,
      isPaused: false
    };
  }

  get actionItems() {
    return [
      {
        icon: faArrowLeft,
        onClick: this.onPrevClick
      },
      {
        icon: faArrowRight,
        onClick: this.onNextClick
      },
      {
        icon: !this.state.isPaused ? faPause : faPlay,
        onClick: this.onToggleClick,
        visible: () => getOption('showPause')
      },
      {
        icon: faFileDownload,
        onClick: this.onDownloadClick
      }
    ];
  }

  get menuItems() {
    return [
      {
        i18nString: 'history',
        icon: faHistory,
        onClick: () => this.openChromeLink('chrome://history')
      },
      {
        i18nString: 'bookmarks',
        icon: faBookmark,
        onClick: () => this.openChromeLink('chrome://bookmarks')
      },
      {
        i18nString: 'apps',
        icon: faRocket,
        onClick: () => this.openChromeLink('chrome://apps')
      }
    ];
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

  processResponse(o) {
    if (o.status >= 200 && o.status < 400) {
      const data = JSON.parse(o.responseText);

      if (data.status === 'success') {
        this.setState({ response: data.response }, () => {
          this.carousel();
          this.carouselTimer = setInterval(
            this.carousel,
            getOption('intervalTime')
          );
        });
        localStorage.setItem('ranking', o.responseText);
      }
    } else {
      this.setError();
    }
  }

  carousel = (next = true) => {
    const works = this.state.response.illusts;
    const val = works[this.state.index];
    document.body.style.backgroundImage =
      'url(' + getProxyImage(val.image_urls.large) + ')';
    const footerWidth = this.footerRef.offsetWidth;
    const rankWidth = this.rankRef.offsetWidth;
    const cutLength = Math.ceil(
      Math.ceil((footerWidth - rankWidth) / 40) * 1.3
    );
    let newIndex = next ? this.state.index + 1 : this.state.index - 1;
    if (newIndex >= works.length) {
      newIndex = 0;
    }
    if (newIndex < 0) {
      newIndex = works.length - 1;
    }

    this.setItem('id', val.id);
    this.setItem('title', cutString(val.title, cutLength));
    this.setItem('url', `https://pixiv.moe/illust/${val.id}`);
    this.setItem(
      'rankNum',
      chrome.i18n.getMessage('rankNum', [this.state.index + 1])
    );
    this.setItem(
      'rankMetaText',
      <>
        <FontAwesomeIcon icon={faHeart} />
        {val.total_bookmarks}
      </>
    );

    if (this.progressTimer) {
      clearInterval(this.progressTimer);
    }

    this.progressTimer = this.createProgressTimer();

    this.setState({ index: newIndex, isPaused: false });
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

  onNextClick = () => {
    clearInterval(this.progressTimer);
    this.carousel(true);
    clearInterval(this.carouselTimer);
    this.carouselTimer = setInterval(this.carousel, getOption('intervalTime'));
  };

  onPrevClick = () => {
    clearInterval(this.progressTimer);
    this.carousel(false);
    clearInterval(this.carouselTimer);
    this.carouselTimer = setInterval(this.carousel, getOption('intervalTime'));
  };

  onToggleClick = () => {
    if (this.state.isPaused) {
      this.progressTimer = this.createProgressTimer();
      this.carouselTimer = setInterval(
        this.carousel,
        getOption('intervalTime')
      );
    } else {
      clearInterval(this.progressTimer);
      clearInterval(this.carouselTimer);
    }
    this.setState({ isPaused: !this.state.isPaused });
  };

  onDownloadClick = () => {
    const illustId = this.getItem('id');
    location.href = `https://api.kotori.love/pixiv/illust/${illustId}.zip`;
  };

  createProgressTimer = () => {
    const startTime = new Date().getTime();
    return setInterval(() => {
      const nowTime = new Date().getTime();
      const eclipseTime = nowTime - startTime;
      const progressPercent = (eclipseTime / getOption('intervalTime')) * 100;
      this.setState({
        progressPercent
      });
    }, 50);
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
      <SafeAnchor onClick={() => this.openLink(this.getItem('url'))}>
        {this.getItem('title')}
      </SafeAnchor>
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
      <SafeAnchor onClick={this.onUpdateClick}>
        {chrome.i18n.getMessage('loadFailed')}
      </SafeAnchor>
    );
  }

  render() {
    return (
      <>
        <div className="top left">
          <div className="top-menu">
            <ul className="nav navbar-nav navbar-right">
              {this.actionItems
                .filter(item => !item.visible || item.visible())
                .map((item, index) => (
                  <li key={index}>
                    <SafeAnchor onClick={item.onClick}>
                      <FontAwesomeIcon icon={item.icon} />
                    </SafeAnchor>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <div className="top right">
          <div className="top-menu">
            <ul className="nav navbar-nav navbar-right">
              {this.menuItems.map((item, index) => (
                <li key={index}>
                  <SafeAnchor onClick={item.onClick}>
                    {getOption('chromeLinkAsIcons') ? (
                      <FontAwesomeIcon icon={item.icon} />
                    ) : (
                      chrome.i18n.getMessage(item.i18nString)
                    )}
                  </SafeAnchor>
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
          getOption('showProgress') && (
            <Progress
              speed={0.07}
              percent={this.state.progressPercent}
              style={{ boxShadow: 'none' }}
            />
          )
        )}

        <footer ref={ref => (this.footerRef = ref)} className="footer">
          <div className="title">{this.renderTitleContent()}</div>
          {this.renderRankContent()}
        </footer>
      </>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('#root'));

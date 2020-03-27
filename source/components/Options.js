import React from 'react';
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@material-ui/core';
import {
  GitHub as GithubIcon,
  Twitter as TwitterIcon,
  Cached as CachedIcon
} from '@material-ui/icons';
import { getOption, setOption } from '../utils';

export default class Options extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: getOption()
    };
  }

  componentDidMount() {
    document.title = chrome.i18n.getMessage('options');
  }

  onChange = (key, event) => {
    const { options } = this.state;
    switch (key) {
      case 'showProgress':
        options[key] = event.target.checked;
        setOption(key, options[key]);
        break;
      case 'intervalTime':
        options[key] = event.target.value;
        setOption(key, options[key]);
        break;
    }
    this.setState({ options });
  };

  onClearCacheClick = () => {
    localStorage.removeItem('ranking');
  };

  openLink = link => {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  render() {
    const { options } = this.state;
    return (
      <div>
        <div className="content">
          <div className="container">
            <h1>{chrome.i18n.getMessage('options')}</h1>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.showProgress}
                    onChange={event => this.onChange('showProgress', event)}
                    color="primary"
                  />
                }
                label={chrome.i18n.getMessage('optionShowProgress')}
              />
            </FormGroup>

            <FormGroup>
              <FormControl>
                <InputLabel
                  shrink
                  id="demo-simple-select-placeholder-label-label">
                  {chrome.i18n.getMessage('optionIntervalTime')}
                </InputLabel>
                <Select
                  labelId="demo-simple-select-placeholder-label-label"
                  id="demo-simple-select-placeholder-label"
                  value={options.intervalTime}
                  onChange={event => this.onChange('intervalTime', event)}>
                  <MenuItem value={6500}>6.5</MenuItem>
                  <MenuItem value={10000}>10</MenuItem>
                  <MenuItem value={15000}>15</MenuItem>
                </Select>
              </FormControl>
            </FormGroup>

            <Button
              style={{ marginTop: 15 }}
              variant="outlined"
              color="primary"
              startIcon={<CachedIcon />}
              onClick={this.onClearCacheClick}>
              {chrome.i18n.getMessage('optionClearCache')}
            </Button>

            <div id="about">
              <p>
                <Button
                  variant="contained"
                  color="default"
                  startIcon={<GithubIcon />}
                  onClick={() =>
                    this.openLink(
                      'https://github.com/kokororin/pixiv-ranking-new-tab'
                    )
                  }>
                  Fork on GitHub
                </Button>

                <Button
                  variant="contained"
                  color="default"
                  startIcon={<TwitterIcon style={{ color: '#1DA1F2' }} />}
                  onClick={() =>
                    this.openLink('https://twitter.com/sora_yakami')
                  }>
                  Follow on Twitter
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

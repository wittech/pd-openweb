import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import ScrollView from 'ming-ui/components/ScrollView';
import WorkSheetComment from './WorkSheetComment';
import WorkSheetFileList from './WorkSheetFileList';
import WorksheetLog from './WorksheetLog';
import './DiscussLogFile.less';

class DiscussLogFile extends Component {
  static propTypes = {
    workflow: PropTypes.element,
    hiddenTabs: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    addCallback: () => {},
    hiddenTabs: [],
  };

  constructor(props) {
    super(props);
    this.getShowTabs(props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hiddenTabs !== this.props.hiddenTabs) {
      this.getShowTabs(nextProps);
    }
  }

  getShowTabs = props => {
    this.showTabs = [
      { id: 1, name: 'discuss', text: _l('讨论') },
      { id: 4, name: 'discussPortal', text: md.global.Account.isPortal ? _l('讨论') : _l('讨论(外部)') },
      { id: 3, name: 'files', text: _l('文件') },
      { id: 2, name: 'logs', text: _l('日志') },
    ].filter(tab => !_.find(props.hiddenTabs, tname => tname === tab.name));
    if (props.workflow) {
      this.showTabs = [{ id: 0, name: 'workflow', text: _l('流程') }].concat(this.showTabs);
    }
    this.state = {
      loading: false,
      status: this.showTabs.length && this.showTabs[0].id, // 日志讨论  1 日志  2讨论
    };
  };

  render() {
    const { workflow } = this.props;
    const { status, loading } = this.state;
    return (
      <div className="discussLogFile flexRow">
        <div className="header">
          {this.showTabs.map(tab => (
            <span
              key={tab.id}
              className={cx(
                'talk ThemeHoverColor3 ThemeHoverBorderColor3 Font14 tab' + tab.id,
                this.state.status === tab.id && 'ThemeColor3 ThemeBorderColor3 border2',
              )}
              onClick={() => {
                this.setState({ status: tab.id, loading: tab.id === status });
                if (tab.id === status) {
                  setTimeout(() => {
                    this.setState({ loading: false });
                  }, 100);
                }
              }}
            >
              <span
                className={cx(
                  'txt InlineBlock overflow_ellipsis WordBreak',
                  this.state.status === tab.id && 'ThemeColor3 ThemeBorderColor3 border2',
                )}
              >
                {tab.text}
              </span>
            </span>
          ))}
        </div>
        {!loading && (
          <div className="body flex">
            {status === 0 && (
              <ScrollView className="flex" style={{ padding: 20 }}>
                {workflow}
              </ScrollView>
            )}
            {(status === 1 || status === 4) && (
              <div className="talkBox">
                <WorkSheetComment status={status} {...this.props} />
              </div>
            )}
            {status === 2 && <WorksheetLog {...this.props} />}
            {status === 3 && <WorkSheetFileList {...this.props} />}
          </div>
        )}
      </div>
    );
  }
}

export default DiscussLogFile;

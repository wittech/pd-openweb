import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { autobind } from 'core-decorators';
import RecordCardListDialog from 'src/components/recordCardListDialog';
import { getTitleTextFromControls } from 'src/components/newCustomFields/tools/utils';
import { FILTER_CONDITION_TYPE } from '../../enum';

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error(err);
    return {};
  }
}

export default class RelateRecord extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    control: PropTypes.shape({}),
    originValues: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    originValues: [],
  };

  constructor(props) {
    super(props);
    let { originValues = [] } = props;
    this.state = {
      records: _.map(originValues, r => safeParse(r)),
      selectRecordVisible: false,
    };
  }

  get selectSingle() {
    const { type, control = {} } = this.props;
    return control.enumDefault === 1 && _.includes([FILTER_CONDITION_TYPE.ARREQ, FILTER_CONDITION_TYPE.ARRNE], type);
  }

  @autobind
  addRecord(selectedRecords) {
    const { control, onChange } = this.props;
    const { records } = this.state;
    const { relationControls } = control;
    const newRecords = (
      this.selectSingle ? [] : records.filter(r => !_.find(selectedRecords, sr => r.id === sr.rowid))
    ).concat(
      selectedRecords.map(sr => ({
        name: getTitleTextFromControls(relationControls, sr),
        id: sr.rowid,
      })),
    );
    this.setState({
      records: newRecords,
    });
    onChange({ values: newRecords.map(r => r.id), fullValues: newRecords.map(v => JSON.stringify(v)) });
  }

  @autobind
  removeRecord(record) {
    const { onChange } = this.props;
    const { records } = this.state;
    const newRecords = records.filter(r => r.id !== record.id);
    this.setState({
      records: newRecords,
    });
    onChange({ values: newRecords.map(r => r.id), fullValues: newRecords.map(v => JSON.stringify(v)) });
  }

  render() {
    const { type, control, disabled } = this.props;
    const { records, selectRecordVisible } = this.state;
    return (
      <div className="worksheetFilterRelateRecordCondition">
        <div className={cx('recordsCon', { disabled })} onClick={() => this.setState({ selectRecordVisible: true })}>
          {records.length ? (
            records.map((record, index) => (
              <div className="recordItem" key={index}>
                <i className="icon icon-link-worksheet"></i>
                <span className="recordname">{record.name}</span>
                <span
                  className="remove"
                  onClick={e => {
                    e.stopPropagation();
                    this.removeRecord(record);
                  }}
                >
                  <i className="icon icon-delete"></i>
                </span>
              </div>
            ))
          ) : (
            <span className="placeholder">{_l('请选择')}</span>
          )}
          {selectRecordVisible && (
            <RecordCardListDialog
              allowNewRecord={false}
              multiple={!this.selectSingle}
              coverCid={control.coverCid}
              filterRowIds={records.map(r => r.id)}
              showControls={control.showControls}
              appId={control.appId}
              viewId={control.viewId}
              relateSheetId={control.dataSource}
              visible={true}
              onClose={() => this.setState({ selectRecordVisible: false })}
              onOk={this.addRecord}
            />
          )}
        </div>
      </div>
    );
  }
}

import React from 'react';
import PropTypes from 'prop-types';
import { autobind } from 'core-decorators';
import cx from 'classnames';
import Trigger from 'rc-trigger';
import DatePicker from 'src/components/newCustomFields/widgets/Date';
import CellErrorTips from './comps/CellErrorTip';
import EditableCellCon from '../EditableCellCon';
import renderText from './renderText';
import { WORKSHEETTABLE_FROM_MODULE } from 'worksheet/constants/enum';
import withClickAway from 'ming-ui/decorators/withClickAway';
import createDecoratedComponent from 'ming-ui/decorators/createDecoratedComponent';
const ClickAwayable = createDecoratedComponent(withClickAway);

export default class Date extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.shape({}),
    editable: PropTypes.bool,
    isediting: PropTypes.bool,
    updateCell: PropTypes.func,
    popupContainer: PropTypes.any,
    cell: PropTypes.shape({ value: PropTypes.string }),
    value: PropTypes.string,
    needLineLimit: PropTypes.bool,
    updateEditingStatus: PropTypes.func,
    onClick: PropTypes.func,
  };
  constructor(props) {
    super(props);
    this.state = {
      value: props.cell.value,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cell.value !== this.props.cell.value) {
      this.setState({ value: nextProps.cell.value });
    }
  }

  editIcon = React.createRef();

  @autobind
  handleChange(value) {
    const { tableFromModule, updateCell, updateEditingStatus, onValidate } = this.props;
    const error = !onValidate(value);
    if (error) {
      if (tableFromModule === WORKSHEETTABLE_FROM_MODULE.SUBLIST) {
        this.setState({
          value,
        });
      }
      return;
    }
    updateCell({
      value,
    });
    this.setState({
      value,
    });
    updateEditingStatus(false);
  }

  @autobind
  handleClear() {
    this.handleChange('');
  }

  render() {
    const {
      className,
      formdata = () => [],
      masterData = () => {},
      style,
      tableFromModule,
      needLineLimit,
      cell,
      popupContainer,
      editable,
      isediting,
      rowIndex,
      error,
      updateEditingStatus,
      updateCell,
      onClick,
    } = this.props;
    const { value } = this.state;
    let cellPopupContainer = popupContainer;
    if (
      tableFromModule === WORKSHEETTABLE_FROM_MODULE.SUBLIST ||
      tableFromModule === WORKSHEETTABLE_FROM_MODULE.RELATE_RECORD
    ) {
      cellPopupContainer = () => document.body;
    }
    return (
      <React.Fragment>
        <Trigger
          getPopupContainer={cellPopupContainer}
          popupVisible={isediting && !!error}
          popup={<CellErrorTips error={error} pos={rowIndex === 1 ? 'bottom' : 'top'} />}
          destroyPopupOnHide
          zIndex="1051"
          popupAlign={{
            points: rowIndex === 1 ? ['tl', 'bl'] : ['bl', 'tl'],
            offset: rowIndex === 1 ? [0, -3] : [0, 0],
          }}
        >
          <EditableCellCon
            onClick={onClick}
            className={cx(className, { canedit: editable })}
            hideOutline
            style={style}
            iconRef={this.editIcon}
            iconName="bellSchedule"
            iconClassName="dateEditIcon"
            isediting={isediting}
            onIconClick={() => updateEditingStatus(true)}
          >
            {!!value && (
              <div className={cx('worksheetCellPureString userSelectNone ellipsis', { linelimit: needLineLimit })}>
                {renderText({ ...cell, value })}
              </div>
            )}
            {isediting && error && <CellErrorTips error={error} pos={rowIndex === 1 ? 'bottom' : 'top'} />}
          </EditableCellCon>
        </Trigger>
        {isediting && (
          <ClickAwayable
            onClickAwayExceptions={[
              this.editIcon && this.editIcon.current,
              '.ant-picker-dropdown',
              '.cellControlDatePicker',
            ]}
            onClickAway={() => {
              updateEditingStatus(false);
              if (tableFromModule === WORKSHEETTABLE_FROM_MODULE.SUBLIST) {
                if (cell.value !== value) {
                  updateCell({
                    value,
                  });
                }
              }
            }}
          >
            <div className={cx('cellControlDatePicker', className)} style={style}>
              <div className="cellControlDatePickerCon">
                <DatePicker
                  {...cell}
                  {...(tableFromModule === WORKSHEETTABLE_FROM_MODULE.SUBLIST ? { value } : {})}
                  formData={formdata()}
                  masterData={masterData()}
                  dropdownClassName="scrollInTable"
                  onChange={this.handleChange}
                  compProps={{
                    autoFocus: true,
                    open: isediting,
                    getPopupContainer: cellPopupContainer,
                  }}
                />
              </div>
            </div>
          </ClickAwayable>
        )}
      </React.Fragment>
    );
  }
}

import React, { Component, Fragment } from 'react';
import { Icon } from 'ming-ui';
import { Menu, Dropdown, Tooltip } from 'antd';
import WithoutFidldItem from './WithoutFidldItem';
import { WIDGETS_TO_API_TYPE_ENUM } from 'src/pages/widgetConfig/config/widget';
import {
    areaParticleSizeDropdownData,
    timeParticleSizeDropdownData,
    isNumberControl,
    isTimeControl,
    isAreaControl,
    filterDisableParticleSizeTypes,
    timeDataParticle,
    filterTimeData,
    timeGatherParticle
} from 'statistics/common';

const timeGather = timeParticleSizeDropdownData.filter(item => [5, 8, 9, 10, 11].includes(item.value));
const timeParticle = timeGatherParticle.filter(item => [11, 12, 14].includes(item.value))

export default class GroupingAxis extends Component {
  constructor(props) {
    super(props);
  }
  handleVerification = (data, isAlert = false) => {
    if (isNumberControl(data.type)) {
      isAlert && alert('数值和公式字段不能分组', 2);
      return false;
    } else {
      return true;
    }
  }
  handleAddControl = data => {
    if (this.handleVerification(data, true)) {
      const { split, disableParticleSizeTypes } = this.props;
      const isTime = isTimeControl(data.type);
      const isArea = isAreaControl(data.type);
      const dropdownData = isTime ? timeGather : areaParticleSizeDropdownData;
      const newDisableParticleSizeTypes = filterDisableParticleSizeTypes(data.controlId, disableParticleSizeTypes);
      const allowTypes = dropdownData.map(item => item.value).filter(item => !newDisableParticleSizeTypes.includes(item));
      this.props.onChangeCurrentReport({
        controlId: data.controlId,
        particleSizeType: (isTime || isArea) ? allowTypes[0] : 0,
        ...data
      });
    }
  }
  handleClear = () => {
    const { split } = this.props;
    this.props.onChangeCurrentReport({
      controlId: null,
      particleSizeType: 0
    });
  }
  handleUpdateTimeParticleSizeType = (value) => {
    const { split } = this.props;
    this.props.onChangeCurrentReport({
      particleSizeType: value
    });
  }
  renderTimeOverlay(axis) {
    const { split, disableParticleSizeTypes } = this.props;
    const showtype = _.get(axis, 'advancedSetting.showtype');
    const newDisableParticleSizeTypes = filterDisableParticleSizeTypes(split.controlId, disableParticleSizeTypes);
    const timeDataList = split.controlType === WIDGETS_TO_API_TYPE_ENUM.TIME ? timeParticle : timeGather;
    return (
      <Menu className="chartControlMenu chartMenu">
        {timeDataList.map(item => (
          <Menu.Item
            className="valignWrapper"
            disabled={item.value === split.particleSizeType ? true : newDisableParticleSizeTypes.includes(item.value)}
            style={{ color: item.value === split.particleSizeType ? '#1e88e5' : null }}
            key={item.value}
            onClick={() => {
              this.handleUpdateTimeParticleSizeType(item.value);
            }}
          >
            <div className="flex">{item.text}</div>
            <div className="Gray_75 Font12">{item.getTime()}</div>
          </Menu.Item>
        ))}
      </Menu>
    )
  }
  renderAreaOverlay() {
    const { split, disableParticleSizeTypes } = this.props;
    const newDisableParticleSizeTypes = filterDisableParticleSizeTypes(split.controlId, disableParticleSizeTypes);
    return (
      <Menu className="chartControlMenu chartMenu">
        {areaParticleSizeDropdownData.map(item => (
          <Menu.Item
            className="valignWrapper"
            disabled={item.value === split.particleSizeType ? true : newDisableParticleSizeTypes.includes(item.value)}
            style={{ color: item.value === split.particleSizeType ? '#1e88e5' : null }}
            key={item.value}
            onClick={() => {
              this.handleUpdateTimeParticleSizeType(item.value);
            }}
          >
            <div className="flex">{item.text}</div>
          </Menu.Item>
        ))}
      </Menu>
    );
  }
  renderAxis(item) {
    const { split, axisControls, allControls } = this.props;
    const axis = _.find(axisControls, { controlId: split.controlId });
    const control = _.find(allControls, { controlId: split.controlId }) || {};
    const isTime = isTimeControl(split.controlType);
    const isArea = isAreaControl(split.controlType);
    return (
      <div className="flexRow valignWrapper fidldItem">
        {axis ? (
          <span className="Gray flex ellipsis">
            {axis.controlName}
            {isTime && ` (${_.find(timeParticleSizeDropdownData, { value: split.particleSizeType || 1 }).text})`}
            {isArea && ` (${_.get(_.find(areaParticleSizeDropdownData, { value: split.particleSizeType || 1 }), 'text')})`}
          </span>
        ) : (
          control.strDefault === '10' ? (
            <span className="Red flex ellipsis">
              {`${control.controlName} (${_l('无效类型')})`}
            </span>
          ) : (
            <Tooltip title={`ID: ${split.controlId}`}>
              <span className="Red flex ellipsis">
                {_l('字段已删除')}
              </span>
            </Tooltip>
          )
        )}
        {isTime && (
          <Dropdown overlay={this.renderTimeOverlay(axis)} trigger={['click']} placement="bottomRight">
            <Icon className="Gray_9e Font18 pointer" icon="arrow-down-border" />
          </Dropdown>
        )}
        {isArea && (
          <Dropdown overlay={this.renderAreaOverlay(axis)} trigger={['click']} placement="bottomRight">
            <Icon className="Gray_9e Font18 pointer" icon="arrow-down-border" />
          </Dropdown>
        )}
        <Icon className="Gray_9e Font18 pointer mLeft10" icon="close" onClick={this.handleClear} />
      </div>
    );
  }
  render() {
    const { name, split, yaxisList } = this.props;
    return yaxisList.length === 1 ? (
      <div className="fieldWrapper mBottom20">
        <div className="Bold mBottom12">{name}</div>
        {split.controlId ? (
          this.renderAxis()
        ) : (
          <WithoutFidldItem onVerification={this.handleVerification} onAddControl={this.handleAddControl} />
        )}
      </div>
    ) : null;
  }
}

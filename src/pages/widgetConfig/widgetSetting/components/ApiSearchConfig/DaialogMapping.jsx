import React, { Fragment, useState } from 'react';
import { getAdvanceSetting, handleAdvancedSettingChange } from 'src/pages/widgetConfig/util/setting';
import { dealRequestControls } from '../../../util/data';
import { Dialog, Support, Icon, Tooltip, ScrollView, Dropdown } from 'ming-ui';
import { getIconByType } from 'src/pages/widgetConfig/util';
import { getMapControls } from '../DynamicDefaultValue/util';
import cx from 'classnames';
import './DialogMapping.less';
import _ from 'lodash';

export default function DialogMapping(props) {
  const { data = {}, responseControls = [], allControls = [], onClose, onChange } = props;
  const { itemsource = '' } = getAdvanceSetting(data);
  const responsemap = getAdvanceSetting(data, 'responsemap') || [];
  const [mappingData, setMappingData] = useState(responsemap);
  const dealData = dealRequestControls(responseControls, true);
  const isBtn = data.type === 49;
  const noData = !data.dataSource || (data.dataSource && !responseControls.length);
  const selectOptions = ((_.find(dealData, i => i.controlId === itemsource) || {}).child || []).map(i => i.controlId);
  const selectData = responseControls
    .filter(i => _.includes(selectOptions, i.controlId))
    .map(item => ({ ...item, dataSource: '' }));

  const renderHeader = showSupport => {
    return (
      <div className={cx('mappingHeader mBottom20', { mTop44: !showSupport })}>
        <span className="Font14 Bold">
          {showSupport ? _l('将所选的数据写入表单字段') : _l('将其他返回数据写入表单字段')}
        </span>
        {showSupport && (
          <Support className="Gray_9e" type={2} text={_l('映射规则')} href="https://help.mingdao.com/sheet47.html" />
        )}
      </div>
    );
  };

  const renderForm = (list = []) => {
    if (!list.length) return null;
    return (
      <Fragment>
        <div className="flexRow Relative Gray_9e">
          <div className="flex">{_l('参数名')}</div>
          <div className="controlSeparate" />
          <div className="flex">{_l('表单字段')}</div>
          {isBtn && (
            <Support
              className="Absolute Gray_9e"
              style={{ right: 0 }}
              type={2}
              text={_l('映射规则')}
              href="https://help.mingdao.com/sheet47.html"
            />
          )}
        </div>
        {list.map(item => {
          return (
            <Fragment>
              {renderItem(item)}
              {item.child && item.child.map(c => renderItem(c))}
            </Fragment>
          );
        })}
      </Fragment>
    );
  };

  const getOptions = item => {
    if (item.type === 10000008) {
      return { iconType: 34, placeholder: _l('请选择子表') };
    }
    if (item.type === 10000007) {
      return { iconType: 2, placeholder: item.dataSource ? _l('请选择子表中的字段') : _l('选择文本，或子表字段') };
    }
    return { iconType: item.type, placeholder: item.dataSource ? _l('请选择子表中的字段') : _l('请选择') };
  };

  const getDropData = (item = {}, showValue) => {
    const parentMappingItem = _.find(mappingData, i => i.id === item.dataSource);
    const filterSelf = allControls.filter(i => i.controlId !== data.controlId);
    const filterMappingData = mappingData.filter(i => (i.subid || i.cid) !== showValue);
    let filterData = [];

    // 如果是子表
    if (parentMappingItem && parentMappingItem.type === 10000008) {
      const parentControl = _.find(filterSelf, i => i.controlId === parentMappingItem.cid) || {};
      filterData = getMapControls(item, parentControl.relationControls).filter(
        i =>
          !_.includes(
            filterMappingData.map(i => i.subid),
            i.controlId,
          ),
      );
    } else {
      filterData = getMapControls(item, filterSelf).filter(
        c =>
          !_.includes(
            filterMappingData.filter(i => i.cid && !i.subid).map(i => i.cid),
            c.controlId,
          ),
      );
    }

    function formatItem(list) {
      return list.map(({ controlId: value, controlName: text, parentId, type, parentName }) => ({
        value,
        text,
        parentId,
        type,
        parentName,
        icon: getIconByType(type),
      }));
    }

    const result = _.map(_.groupBy(filterData, 'parentId'), (list, type) => {
      if (type === 'undefined') {
        return formatItem(list);
      } else {
        return [
          {
            ...formatItem(list)[0],
            title: _.get(
              _.find(filterData, i => i.parentId === type),
              'parentName',
            ),
          },
          ...formatItem(list).slice(1),
        ];
      }
    });

    return _.flatten(result);
  };

  const handleChange = (value, item, parentId) => {
    let newItem = {};
    if (item.dataSource) {
      const parentMappingItem = _.find(mappingData, i => i.id === item.dataSource);
      if (parentMappingItem && parentMappingItem.type === 10000008) {
        const parentControl = _.find(allControls, i => i.controlId === parentMappingItem.cid);
        newItem = {
          type: item.type,
          pid: item.dataSource,
          id: item.controlId,
          cid: parentControl.controlId,
          subid: value,
        };
      }
    } else {
      if (item.type === 10000007 && parentId) {
        newItem = { type: item.type, id: item.controlId, cid: parentId, subid: value };
      } else {
        newItem = { type: item.type, id: item.controlId, cid: value, subid: '' };
      }
    }
    let index = _.findIndex(mappingData, i => i.id === newItem.id && findControl(i, newItem));

    let newResponseMap = [];
    if (_.isUndefined(value)) {
      newResponseMap = mappingData.filter((i, idx) => idx !== index);
    } else {
      newResponseMap =
        index > -1
          ? [...mappingData.slice(0, index), newItem, ...mappingData.slice(index + 1)]
          : mappingData.concat(newItem);
    }

    // 清空无父级的子选项
    newResponseMap = newResponseMap.filter(i => !i.pid || _.find(newResponseMap, n => n.id === i.pid));
    setMappingData(newResponseMap);
  };

  const findControl = (i, newItem) => {
    if (!_.includes(selectOptions, i.id)) return true;
    return newItem.subid || _.isUndefined(newItem.subid) ? i.pid === newItem.pid : !i.subid;
  };

  const findCurrentValue = (item = {}, i = {}) => {
    if (item.dataSource) return i.subid;
    if (item.type === 10000007) return i.subid || i.cid;
    if (!item.dataSource && !i.subid) return i.cid;
    return undefined;
  };

  const renderItem = item => {
    const { iconType, placeholder } = getOptions(item);
    // 单条映射的配置
    const mappingItem = _.find(mappingData, i => i.id === item.controlId && findCurrentValue(item, i));

    const showValue = mappingItem ? findCurrentValue(item, mappingItem) : undefined;
    const disabled = item.dataSource
      ? !_.get(
          _.find(mappingData, i => i.id === item.dataSource),
          'cid',
        )
      : false;

    const dropData = getDropData(item, showValue);
    const control = _.find(dropData, i => i.value === showValue);
    const isDelete = !control && showValue;

    return (
      <div className="mappingItemBox" key={item.controlId}>
        <div className="sourceControls flex">
          <div className={cx('controlItem flexRow', { childPadding: item.dataSource })}>
            <Icon className="Font16 Gray_9e" icon={getIconByType(iconType)} />
            <span className="mLeft10 ellipsis flex">{item.controlName}</span>
            {item.type === 10000007 && <span className="Gray_9e">{_l('多条')}</span>}
          </div>
        </div>

        <div className="controlSeparate">
          <i className={cx('icon-backspace Font18', showValue ? 'ThemeColor3' : 'Gray_bd')} />
        </div>

        <div className="mappingControl">
          <Dropdown
            border
            openSearch
            cancelAble
            data={dropData}
            disabled={disabled}
            isAppendToBody
            value={isDelete ? undefined : showValue || undefined}
            menuClass="mappingMenuClass"
            placeholder={
              isDelete ? (
                <span className="flex flexCenter ellipsis">
                  <Icon className="Font16 Red" icon="error1" />
                  <Tooltip text={<span>{_l('ID: %0', showValue)}</span>} popupPlacement="bottom">
                    <span className="mLeft10 ellipsis flex Red">{_l('字段已删除')} </span>
                  </Tooltip>
                </span>
              ) : (
                placeholder
              )
            }
            onChange={value => {
              const parentId = _.get(
                _.find(dropData, i => i.value === value),
                'parentId',
              );
              handleChange(value, item, parentId);
            }}
          />
        </div>
      </div>
    );
  };

  const renderNoData = () => {
    return (
      <div className="mappingNoDataBox">
        <Support
          className="Gray_9e Right"
          type={2}
          text={_l('映射规则')}
          href="https://help.mingdao.com/sheet47.html"
        />
        <div className="noDataContent">{_l('没有返回参数, 请检查模版配置')}</div>
      </div>
    );
  };

  return (
    <Dialog
      visible={true}
      width={720}
      title={<span className="Bold">{_l('建立映射')}</span>}
      onCancel={onClose}
      className={cx('DialogMappingConfig', { mappingHeight: noData })}
      okText={_l('保存')}
      onOk={() => {
        const filterMapping = mappingData.filter(i => i.cid);
        onChange(handleAdvancedSettingChange(data, { responsemap: JSON.stringify(filterMapping) }));
        onClose();
      }}
    >
      <div className="mappingConfigControlBox flex flexColumn">
        {noData ? (
          renderNoData()
        ) : (
          <ScrollView className="controlBox flex mTop15">
            {isBtn ? (
              renderForm(dealData)
            ) : (
              <Fragment>
                {selectOptions.length > 0 && (
                  <Fragment>
                    {renderHeader(true)}
                    {renderForm(selectData, true)}
                  </Fragment>
                )}
                {renderHeader()}
                {renderForm(dealData)}
              </Fragment>
            )}
          </ScrollView>
        )}
      </div>
    </Dialog>
  );
}

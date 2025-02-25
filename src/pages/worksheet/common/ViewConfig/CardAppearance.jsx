import React, { Component, Fragment } from 'react';
import { Dropdown, Icon, Checkbox } from 'ming-ui';
import { Text, FlexCenter } from 'worksheet/styled';
import styled from 'styled-components';
import { getAdvanceSetting } from 'src/util';
import { getIconByType } from 'src/pages/widgetConfig/util';
import { filterAndFormatterControls } from 'src/pages/worksheet/views/util';
import { hierarchyViewCanSelectFields } from 'src/pages/worksheet/views/HierarchyView/util';
import { COVER_DISPLAY_MODE, updateViewAdvancedSetting, ViewSettingWrap } from './util';
import Abstract from './components/Abstract';
import CoverSetting from './components/CoverSettingCon';
import DisplayControl from './components/DisplayControl';
import NavShow from 'src/pages/worksheet/common/ViewConfig/components/navGroup/NavShow';
import { NAVSHOW_TYPE } from 'src/pages/worksheet/common/ViewConfig/components/navGroup/util';
const DisplayControlOption = styled(FlexCenter)`
  .icon {
    font-size: 16px;
    color: rgba(0, 0, 0, 0.4);
    margin-right: 4px;
  }
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 4px;
  }
`;

const SelectValue = styled(DisplayControlOption)`
  &：hover {
    .icon {
      color: #2196f3;
    }
  }
`;

const Wrap = styled.div`
  .Dropdown {
    .Dropdown--input {
      padding: 0 5px 0 12px !important;
    }
  }
`;
export default class CardAppearance extends Component {
  static propTypes = {};
  static defaultProps = {};
  constructor(props) {
    super(props);
    this.state = {
      relateControls: [],
    };
  }

  render() {
    const { worksheetControls, currentSheetInfo, updateCurrentView, view, appId, columns } = this.props;
    const allCanSelectFieldsInBoardControls = filterAndFormatterControls({
      controls: worksheetControls,
      formatter: ({ controlName, controlId, type }) => ({
        value: controlId,
        text: controlName,
        icon: getIconByType(type, false),
      }),
    });
    const { viewControl, childType, viewType, advancedSetting } = view;
    const viewControlData = worksheetControls.find(o => o.controlId === viewControl) || {};
    const { hidenone = '0', navshow = [26].includes(viewControlData.type) ? '1' : '0' } = getAdvanceSetting(view);
    const isBoardView = String(viewType) === '1';
    const isHierarchyView = String(viewType) === '2';
    const isGallery = String(viewType) === '3';
    const isMultiHierarchyView = isHierarchyView && String(childType) === '2';
    let navfilters = getAdvanceSetting(view).navfilters;
    // const isShowDisplayConfig = () => {
    //   // 人员看板不显示此配置
    //   const { type } = find(worksheetControls, item => item.controlId === viewControl) || {};
    //   return type !== 26;
    // };

    const getViewSelectFields = () => {
      if (viewControl === 'create') {
        return [
          {
            text: _l('父-子'),
            value: 'create',
            icon: 'link-worksheet',
          },
        ];
      }
      return isHierarchyView
        ? hierarchyViewCanSelectFields({
            worksheetId: currentSheetInfo.worksheetId,
            controls: worksheetControls,
          })
        : allCanSelectFieldsInBoardControls;
    };
    return (
      <ViewSettingWrap>
        {!isMultiHierarchyView && !isGallery && (
          <Fragment>
            <div className="title withSwitchConfig" style={{ marginTop: '0px', height: '24px' }}>
              {isHierarchyView ? _l('关联本表字段') : _l('分组字段')}
              {/* {isBoardView && isShowDisplayConfig() && (
                <div className="configSwitch">
                  <div className="switchText InlineBlock Normal Gray_9e">{_l('隐藏无数据看板')}</div>
                  <Icon
                    icon={hidenone === '1' ? 'ic_toggle_on' : 'ic_toggle_off'}
                    className="Font24 Hand"
                    onClick={() => {
                      updateCurrentView({
                        ...view,
                        appId,
                        advancedSetting: updateViewAdvancedSetting(view, { hidenone: hidenone === '1' ? '0' : '1' }),
                        editAttrs: ['advancedSetting'],
                      });
                    }}
                  />
                </div>
              )} */}
            </div>
            <div className="settingContent">
              <Dropdown
                data={getViewSelectFields()}
                value={viewControl}
                className="allCanSelectFields"
                hoverTheme
                renderTitle={obj => {
                  const { icon, text } = obj || {};
                  return (
                    <SelectValue>
                      <Icon icon={icon} />
                      <span>{text}</span>
                    </SelectValue>
                  );
                }}
                onChange={value => {
                  if (viewControl === value) {
                    return;
                  }
                  const viewControlData = worksheetControls.find(o => o.controlId === value) || {};
                  updateCurrentView({
                    ...view,
                    appId,
                    viewControl: value,
                    advancedSetting: updateViewAdvancedSetting(view, {
                      navshow: [26].includes(viewControlData.type) ? '1' : '0',
                      navfilters: JSON.stringify([]),
                    }),
                    editAttrs: ['viewControl', 'advancedSetting'],
                  });
                }}
                border
                style={{ width: '100%' }}
                placeholder={_l('请选择')}
              />
            </div>
            {isBoardView && (
              <Wrap>
                <NavShow
                  params={{
                    types: NAVSHOW_TYPE.filter(o =>
                      viewControlData.type === 29
                        ? true //关联记录 4项
                        : [9, 10, 11, 28].includes(viewControlData.type) // 排除筛选
                        ? o.value !== '3'
                        : [26].includes(viewControlData.type) //分组字段为人员时，显示设置只有 显示有数据的项，显示指定项
                        ? ['1', '2'].includes(o.value)
                        : true,
                    ),
                    txt: _l('显示项'),
                  }}
                  value={navshow}
                  onChange={newValue => {
                    updateCurrentView({
                      ...view,
                      appId,
                      advancedSetting: updateViewAdvancedSetting(view, { ...newValue }),
                      editAttrs: ['advancedSetting'],
                    });
                  }}
                  navfilters={navfilters}
                  filterInfo={{
                    relateControls: worksheetControls,
                    allControls: worksheetControls,
                    globalSheetInfo: _.pick(currentSheetInfo, [
                      'appId',
                      'groupId',
                      'name',
                      'projectId',
                      'roleType',
                      'worksheetId',
                    ]),
                    columns,
                    viewControl,
                  }}
                />
              </Wrap>
            )}
            <div
              className="line mTop32 mBottom32"
              style={{
                borderBottom: '1px solid #EAEAEA',
              }}
            ></div>
          </Fragment>
        )}
        <div className="title mBottom24 bold">{_l('卡片外观')}</div>
        {/* abstract：摘要控件ID */}
        <Abstract
          {...this.props}
          advancedSetting={advancedSetting}
          handleChange={value => {
            updateCurrentView({
              ...view,
              appId,
              advancedSetting: updateViewAdvancedSetting(view, { abstract: value }),
              editAttrs: ['advancedSetting'],
            });
          }}
        />
        {/* 显示字段 */}
        <DisplayControl
          {...this.props}
          handleChange={checked => {
            updateCurrentView({ ...view, appId, showControlName: checked, editAttrs: ['showControlName'] }, false);
          }}
          handleChangeSort={({ newControlSorts, newShowControls }) => {
            updateCurrentView(
              {
                ...view,
                appId,
                controlsSorts: newControlSorts,
                displayControls: newShowControls,
                editAttrs: ['controlsSorts', 'displayControls'],
              },
              false,
            );
          }}
        />
        {/* 封面图片 */}
        <CoverSetting
          {...this.props}
          advancedSetting={advancedSetting}
          // 是否显示
          handleChangeIsCover={value =>
            updateCurrentView({
              ...view,
              appId,
              coverCid: value === 'notDisplay' ? '' : value,
              editAttrs: ['coverCid'],
            })
          }
          // 显示位置
          handleChangePosition={(value, coverTypeValue) => {
            updateCurrentView({
              ...view,
              appId,
              coverType: coverTypeValue,
              advancedSetting: updateViewAdvancedSetting(view, { coverposition: value }),
              editAttrs: ['coverType', 'advancedSetting'],
            });
          }}
          // 显示方式
          handleChangeType={value =>
            updateCurrentView({ ...view, appId, coverType: value, editAttrs: ['coverType'] }, false)
          }
          // 允许点击查看
          handleChangeOpencover={value => {
            updateCurrentView({
              ...view,
              appId,
              advancedSetting: updateViewAdvancedSetting(view, { opencover: value }),
              editAttrs: ['advancedSetting'],
            });
          }}
        />
      </ViewSettingWrap>
    );
  }
}

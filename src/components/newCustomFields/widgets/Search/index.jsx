import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Select } from 'antd';
import { LoadDiv, Icon } from 'ming-ui';
import { browserIsMobile } from 'src/util';
import MobileSearch from './MobileSearch';
import { getParamsByConfigs, getShowValue, clearValue } from './util';
import { excuteApiQuery } from 'src/api/worksheet';
import { v4 as uuidv4 } from 'uuid';
import cx from 'classnames';
import './index.less';
import _ from 'lodash';

const SearchBtn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  max-width: ${props => (props.isMobile ? '100%' : props.maxWidth || '320px')};
  width: 100%;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  padding: 0 24px;
  background: #fff;
  color: #333;
  &:hover {
    background: ${props => (props.isMobile ? '#fff' : '#f8f8f8')};
  }
  .successIcon {
    color: #4caf50;
    font-size: 18px;
    vertical-align: text-bottom;
  }
  .mobileLoading {
    .MdLoader-path {
      stroke: #bebebe;
    }
  }
`;

export default class Widgets extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      isSuccess: false,
      open: false,
      keywords: '',
      data: {},
    };
  }

  componentDidMount() {
    if (_.get(this.props, 'defaultSelectProps.open')) {
      if (this.props.enumDefault !== 2) {
        this.handleSearch();
      } else if (this.props.enumDefault === 2 && this.box) {
        setTimeout(() => {
          try {
            this.box.querySelector('.ant-select-selection-search-input').focus();
          } catch (err) {
            console.log(err);
          }
        }, 100);
      }
    }
  }

  realTimeSearch = _.throttle(mobileKeywords => this.handleSearch(mobileKeywords), 300);

  handleSearch = (mobileKeywords = '') => {
    const {
      advancedSetting: { requestmap, itemsource, itemtitle } = {},
      dataSource,
      formData,
      worksheetId,
      controlId,
      projectId,
      appId,
      type,
      getControlRef,
    } = this.props;
    const { keywords } = this.state;
    const isMobile = browserIsMobile();

    const requestMap = safeParse(requestmap || '[]');
    if (!dataSource) return alert(_l('模版为空或已删除'), 3);
    if (type === 50 && (!itemsource || !itemtitle)) return alert(_l('下拉框的必填映射项未配置(选项列表，选项名)'), 3);
    // 有配置api和请求参数
    if (this.postList) {
      this.postList.abort();
    }

    this.setState({ loading: true, open: true });
    let searchValue = isMobile ? mobileKeywords : keywords;
    const paramsData = getParamsByConfigs(requestMap, formData, searchValue, getControlRef);

    let params = {
      data: !requestMap.length || _.isEmpty(paramsData) ? '' : paramsData,
      projectId,
      workSheetId: worksheetId,
      controlId,
      apkId: appId,
      apiTemplateId: dataSource,
    };

    if (window.isPublicWorksheet) {
      params.formId = window.publicWorksheetShareId;
    }

    this.postList = excuteApiQuery(params);

    this.postList.then(res => {
      if (res.message) {
        alert(res.message, 3);
        this.setState({ isSuccess: false, loading: false, data: {} });
        return;
      }

      this.setState({ isSuccess: true, loading: false, data: res.apiQueryData || {} }, () => {
        // 按钮直接更新
        if (type === 49) {
          this.handleUpdate(res.apiQueryData);
        }
      });
    });
  };

  handleUpdate = (itemData = {}) => {
    const { advancedSetting: { responsemap } = {}, formData } = this.props;
    const responseMap = safeParse(responsemap || '[]');
    responseMap.map(item => {
      const control = _.find(formData, i => i.controlId === item.cid);
      if (control && !_.isUndefined(itemData[item.cid])) {
        // 子表直接赋值
        if (control.type === 34 && _.includes([10000007, 10000008], item.type)) {
          this.props.onChange(
            {
              action: 'clearAndSet',
              rows: safeParse(itemData[item.cid] || '[]').map(i => {
                return {
                  ...i,
                  rowid: `temprowid-${uuidv4()}`,
                  allowedit: true,
                  addTime: new Date().getTime(),
                };
              }),
            },
            control.controlId,
          );
        } else if (!item.subid) {
          this.props.onChange(itemData[item.cid], control.controlId);
        }
      }
    });
  };

  handleSelect = item => {
    const { advancedSetting: { responsemap } = {} } = this.props;
    const { data = {} } = this.state;
    const responseMap = safeParse(responsemap || '[]');
    let rowData = {};

    const newValue = this.getOptions().filter((i, idx) => `${idx}` === item.key);
    responseMap.map(i => {
      if (!i.subid && _.isUndefined(data[i.cid])) {
        rowData[i.cid] = clearValue((newValue[0] || {})[i.id]);
      }
    });

    this.handleUpdate({ ...data, ...rowData });
  };

  getOptions = () => {
    const { advancedSetting: { itemsource } = {} } = this.props;
    const { data = {} } = this.state;
    return safeParse(data[itemsource] || '[]');
  };

  getMappingItem = i => {
    const { advancedSetting: { responsemap } = {}, formData = [] } = this.props;
    const responseMap = safeParse(responsemap || '[]');
    const curMap = _.find(responseMap, re => re.id === i && !re.pid && !re.subid);
    return curMap ? _.find(formData, c => c.controlId === curMap.cid) : '';
  };

  renderList = item => {
    const {
      advancedSetting: { itemtitle, itemdesc },
    } = this.props;
    const itemDesc = safeParse(itemdesc || '[]');
    const itemDescValues = itemDesc
      .map(i => {
        const mappingItem = this.getMappingItem(i);
        return getShowValue(mappingItem, item[i]);
      })
      .filter(i => i);

    const titleValue = getShowValue(this.getMappingItem(itemtitle), item[itemtitle]);
    const isMobile = browserIsMobile();
    return (
      <Fragment>
        <div className={cx('ellipsis', { Gray: isMobile, Bold: itemDesc.length > 0 })}>
          {titleValue || _l('无标题')}
        </div>
        {itemDescValues.length ? (
          <span className={cx('Font12 Gray_75 LineHeight16')} style={{ whiteSpace: 'normal' }}>
            {itemDescValues.join(' | ')}
          </span>
        ) : null}
      </Fragment>
    );
  };

  getSuffixIcon = () => {
    const { enumDefault, disabled, advancedSetting: { clicksearch, min = '0' } = {} } = this.props;
    const canClick = this.state.keywords.length >= parseInt(min);
    if (enumDefault === 2) {
      if (clicksearch === '1') {
        return <Icon icon="search1 Font14" />;
      }
      return (
        <div
          className={cx('searchIconBox', { disabled: disabled || !canClick })}
          onClick={e => {
            e.stopPropagation();
            if (!canClick) return alert(_l('最少输入%0个关键字', min));
            this.handleSearch();
          }}
        >
          <i className="icon-search1 pointer Font18"></i>
        </div>
      );
    }

    return <Icon icon="arrow-down-border Font14" />;
  };

  render() {
    const {
      isCell,
      advancedSetting = {},
      defaultSelectProps = {},
      type,
      enumDefault,
      disabled,
      dropdownClassName,
      value,
      onVisibleChange = () => {},
      controlName,
      hint = '',
    } = this.props;
    const { itemtitle = '', clicksearch, searchfirst, min = '0' } = advancedSetting;
    const { loading, isSuccess, keywords, data = {}, open } = this.state;

    let isMobile = browserIsMobile();

    if (type === 49) {
      return (
        <SearchBtn
          onClick={() => {
            if (loading) return;
            this.handleSearch();
          }}
          isMobile={isMobile}
          maxWidth={hint.length <= 2 ? '120px' : '320px'}
        >
          {loading ? (
            <LoadDiv size="small" className={cx({ mobileLoading: isMobile })} />
          ) : (
            <span className="TxtCenter flex overflow_ellipsis">
              {isSuccess && <i className="icon-done successIcon"></i>}
              <span style={{ fontWeight: '500' }}> {hint || _l('查询')}</span>
            </span>
          )}
        </SearchBtn>
      );
    }

    let optionData = this.getOptions();
    const suffixIcon = this.getSuffixIcon();
    // 按钮搜索下拉框
    const isSelectBtn = enumDefault === 2 && clicksearch !== '1';
    let selectProps = {};

    // 下拉框
    if (enumDefault === 1) {
      selectProps = {
        onSearch: keywords => this.setState({ keywords }),
        filterOption: (inputValue, option) => {
          return `${option.label}`.indexOf(inputValue) > -1;
        },
        onDropdownVisibleChange: open => {
          this.setState({ keywords: '' });
          open ? this.handleSearch() : this.search.blur();
          onVisibleChange(open);
        },
      };
    }

    // 搜索下拉框
    if (enumDefault === 2) {
      selectProps = {
        onSearch: keywords =>
          this.setState({ keywords }, () => {
            // 实时搜索
            if (clicksearch === '1') {
              if (this.state.keywords.length < parseInt(min)) return;
              this.realTimeSearch();
            }
          }),
        filterOption: false,
        onInputKeyDown: e => {
          // 按钮回车搜索
          if (e.keyCode === 13 && clicksearch !== '1') {
            this.handleSearch();
          }
        },
        onDropdownVisibleChange: open => {
          this.setState({ keywords: '' });
          // 预加载
          if (searchfirst === '1' && open) {
            this.handleSearch();
          }
          if (!open) {
            this.setState({ open });
            this.search.blur();
          }
          onVisibleChange(open);
        },
      };
    }
    if (isMobile) {
      return (
        <MobileSearch
          value={value}
          hint={hint}
          loading={loading}
          enumDefault={enumDefault}
          onChange={this.props.onChange}
          controlName={controlName}
          advancedSetting={advancedSetting}
          optionData={optionData}
          handleSearch={this.handleSearch}
          renderList={this.renderList}
          realTimeSearch={this.realTimeSearch}
          disabled={disabled}
          handleSelect={this.handleSelect}
        />
      );
    }
    return (
      <div ref={con => (this.box = con)}>
        <Select
          ref={search => {
            this.search = search;
          }}
          getPopupContainer={() => (isCell ? document.body : this.box)}
          dropdownClassName={dropdownClassName}
          className={cx('w100 customAntSelect', { customApiSelect: isSelectBtn, customSelectIcon: enumDefault === 2 })}
          disabled={disabled}
          allowClear={value}
          listHeight={320}
          optionLabelProp="label"
          searchValue={keywords}
          value={value}
          placeholder={hint || _l('请选择')}
          showSearch={true}
          suffixIcon={suffixIcon}
          {...{ ...defaultSelectProps, ...selectProps }}
          notFoundContent={
            // 搜索框不打开时
            !open ? null : loading ? (
              <LoadDiv className="flexCenter" size="small" />
            ) : (
              <span className="Gray_9e">{_l('没有返回结果')}</span>
            )
          }
          onSelect={(value, option) => this.handleSelect(option)}
          onChange={value => {
            // keywords判断是为了直接点击删除
            if (value || !keywords.length) {
              this.props.onChange(value);
            }
          }}
          onBlur={() => {
            this.setState({ data: {}, open: false });
          }}
        >
          {optionData.map((item, index) => {
            const label = getShowValue(this.getMappingItem(itemtitle), item[itemtitle]);
            return (
              <Select.Option key={index} value={label} label={label}>
                {this.renderList(item)}
              </Select.Option>
            );
          })}
        </Select>
      </div>
    );
  }
}

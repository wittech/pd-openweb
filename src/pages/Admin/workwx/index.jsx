import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { Switch, Icon, Button, LoadDiv, Checkbox } from 'ming-ui';
import { Tabs, Popover, Radio, Input, Select } from 'antd';
import Ajax from 'src/api/workWeiXin';
import Config from '../config';
import Dialog from 'ming-ui/components/Dialog';
import { navigateTo } from 'src/router/navigateTo';
import BuildAppNewRules from './BuildAppNewRules';
import IntegrationSetPssword from '../components/IntegrationSetPssword';
import SyncDialog from './components/SyncDialog';
import InterfaceLicense from './components/InterfaceLicense';
import UpgradeVersion from '../components/UpgradeVersion';
import { getFeatureStatus } from 'src/util';
import './style.less';

const FEATURE_ID = 19;

export default class Workwx extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageLoading: true,
      hasApply: false, //是否已提交申请/尚未提交申请false
      isPassApply: false, //是否已通过申请
      isReject: false, //是否已拒绝申请
      isHasInfo: false, //是否已填对接信息
      canEditInfo: true, //是否可编辑输入框
      isShowCorpId: false,
      isShowAgentId: false,
      isShowSecret: false,
      CorpId: null,
      AgentId: null,
      Secret: null,
      CorpIdFormat: null, //用于显示
      AgentIdFormat: null,
      SecretFormat: null,
      isCloseDing: false,
      showSyncDiaLog: false,
      data: null,
      show1: false,
      show2: false,
      isLoading: false,
      canSyncBtn: false,
      intergrationScanEnabled: false,
      customMappingFieldEnabled: false,
      jobnumberMappingField: null,
      fieldRadio: null,
      isSetPassword: false,
      passwordError: false,
      syncWXLabel: md.global.Config.IsLocal ? 'job' : 'organize',
    };
  }

  componentDidMount() {
    Config.setPageTitle(_l('企业微信'));
    Ajax.getWXProjectSettingInfo({ projectId: Config.projectId }).then(res => {
      this.setState({
        pageLoading: false,
      });
      if (!res) {
        res = {
          corpId: '',
          agentId: '',
          secret: '',
          status: md.global.Config.IsLocal ? 1 : '',
        };
      }
      if (res) {
        this.setState({
          hasApply: !!res,
          //"status: 集成状态，主要通过该值展现：1代表申请通过并提供了使用；0代表提交了申请；-1代表拒绝申请；2代表之前集成过但关闭了集成"
          isPassApply: res.status === 2 || res.status === 1,
          isReject: res.status === -1,
          CorpId: res.corpId,
          AgentId: res.agentId,
          Secret: res.secret,
          isHasInfo: res.status === 2 || (res.corpId && res.agentId && res.secret),
          canEditInfo: !res.corpId && !res.agentId && !res.secret,
          isCloseDing: res.status === 2,
          CorpIdFormat: this.formatStr(res.corpId), //用于显示
          AgentIdFormat: this.formatStr(res.agentId),
          SecretFormat: this.formatStr(res.secret),
          show1: !(res.corpId && res.agentId && res.secret && res.status != 2),
          show2: !(res.corpId && res.agentId && res.secret && res.status != 2),
          intergrationScanEnabled: res.intergrationScanEnabled,
          customMappingFieldEnabled: res.customMappingFieldEnabled,
          jobnumberMappingField: res.jobnumberMappingField,
          fieldRadio: res.jobnumberMappingField !== 'workxeixinapp-userid' ? 'customField' : res.jobnumberMappingField,
          status: res.status,
          intergrationType: res.intergrationType, // 1代表老的模式，2代表待开发模式
          syncWXLabel: res.wxTagMappingField ? res.wxTagMappingField : this.state.syncWXLabel,
          syncWXLabelChecked: res.wxTagMappingField ? true : false,
        });
      }
    });
  }

  // 保存信息/编辑信息
  editInfo = () => {
    if (!this.state.AgentId || !this.state.Secret || !this.state.CorpId) {
      alert('请输入相关信息');
      return;
    }
    Ajax.editWXProjectSetting({
      projectId: Config.projectId,
      agentId: this.state.AgentId,
      secret: this.state.Secret,
      corpId: this.state.CorpId,
    }).then(res => {
      if (res) {
        if (res.item1) {
          this.setState({
            isHasInfo: true,
            canEditInfo: false,
          });
        } else {
          alert(res.item2);
        }
      }
    });
  };

  handleChangeScanEnabled = checked => {
    Ajax.editWXProjectScanEnabled({
      projectId: Config.projectId,
      status: checked ? 0 : 1,
    }).then(res => {
      if (res) {
        this.setState({
          intergrationScanEnabled: !checked,
        });
      }
    });
  };

  // 获取初始密码值
  getInitialPassword = () => {
    Ajax.getIntergrationAccountInitializeInfo({
      projectId: Config.projectId,
    }).then(res => {
      this.setState({ password: res, isSetPassword: !!res });
    });
  };

  handleSaveJobnumberMappingField = () => {
    const { fieldRadio, jobnumberMappingField } = this.state;
    const fieldName = jobnumberMappingField.trim();
    if (fieldName) {
      Ajax.editWXProjectJobnumberMappingField({
        projectId: Config.projectId,
        fieldName,
      }).then(res => {
        if (res && fieldRadio === 'customField') {
          alert(_l('保存成功'));
        }
      });
    } else {
      alert(_l('请输入信息字段'), 2);
    }
  };

  handleChangeJobnumberMappingField = event => {
    const { jobnumberMappingField } = this.state;
    const { value } = event.target;
    const isWorkxeixinapp = value === 'workxeixinapp-userid';
    this.setState(
      {
        fieldRadio: value,
        jobnumberMappingField: isWorkxeixinapp ? value : '',
      },
      () => {
        isWorkxeixinapp && this.handleSaveJobnumberMappingField();
      },
    );
  };

  formatStr = str => {
    if (!str) return;
    let newStr;
    if (str.length === 4) {
      newStr = str.substr(0, 3) + '*';
    } else if (str.length > 4) {
      let char = '';
      for (let i = 0, len = str.length - 4; i < len; i++) {
        char += '*';
      }
      newStr = str.substr(0, 3) + char + str.substr(-3, 3);
    } else {
      newStr = str;
    }
    return newStr;
  };

  editDingStatus = num => {
    this.editWXProjectSettingStatus(num, () => {
      this.setState({
        isCloseDing: !this.state.isCloseDing,
      });
    });
  };

  inputRender = (strId, w, img1, img2) => {
    return (
      <React.Fragment>
        <div className="inputTitleBox">
          <span className="inputTitle">{`${strId}：`}</span>
          <Popover
            title={null}
            arrowPointAtCenter={true}
            placement="bottomLeft"
            overlayClassName="workwxPopoverWrapper"
            content={
              <span className="card Relative overflowHidden">
                <img
                  width={w}
                  className="mTop1"
                  src={`/src/pages/Admin/workwx/workwxSyncCourse/img/${img1}.png`}
                  alt={_l('点击“自建应用”进入新建应用页面')}
                />
                {img2 ? (
                  <img
                    width={w}
                    className="mTop1 Block"
                    src={`/src/pages/Admin/workwx/workwxSyncCourse/img/${img2}.png`}
                    alt={_l('点击“自建应用”进入新建应用页面')}
                  />
                ) : null}
              </span>
            }
          >
            <Icon icon="sidebar_help" className="Font18 Gray_9e" />
          </Popover>
        </div>
        <div className="Relative InlineBlock inputDiv clearfix">
          {this.state.canEditInfo && this.state.intergrationType !== 2 ? (
            <React.Fragment>
              <input
                type="text"
                className="inputBox"
                onChange={e => {
                  this.setState({
                    [strId]: e.target.value,
                    [`${strId}Format`]: this.formatStr(e.target.value),
                  });
                }}
                value={this.state[strId]}
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <input
                type="text"
                className="inputBox"
                readOnly
                value={!this.state[`isShow${strId}`] ? this.state[`${strId}Format`] : this.state[strId]}
              />
              <Icon
                icon={!this.state[`isShow${strId}`] ? 'circulated' : 'public-folder-hidden'}
                className="Gray_9e Font18 isShowIcon"
                onClick={() => {
                  this.setState({
                    [`isShow${strId}`]: !this.state[`isShow${strId}`],
                  });
                }}
              />
            </React.Fragment>
          )}
        </div>
      </React.Fragment>
    );
  };
  getCount = type => {
    const { logDetailItems = [] } = this.state;
    let itemArr = logDetailItems.filter(item => item.type === type);
    return (itemArr && !_.isEmpty(itemArr) && itemArr[0].items.length) || 0;
  };

  renderOverLinitDialog = () => {
    const { dialogOverlimit, overlinitLength } = this.state;
    return (
      <Dialog
        width="500px"
        title={_l('同步失败')}
        visible={dialogOverlimit}
        showCancel={false}
        onCancel={() => {
          this.setState({ dialogOverlimit: false });
        }}
        onOk={() => {
          this.setState({ dialogOverlimit: false });
        }}
      >
        <div>{_l('超出 %0 个企业微信用户需要被同步，请先增购组织用户', overlinitLength)}</div>
      </Dialog>
    );
  };

  checkSyncFn = showSyncDiaLog => {
    this.setState({ loading: true });
    Ajax.checkWorkWXToMingByApp({
      projectId: Config.projectId,
    }).then(res => {
      const { item1, item2, item3 = {} } = res;
      if (!item1) {
        alert(_l('同步失败'));
        this.setState({ loading: false });
        return;
      }

      const { logDetailItems = [], mingDaoUserInfos = [] } = item3;
      let itemArr = logDetailItems.filter(item => item.type === 7);
      let overlinitLength = (itemArr && !_.isEmpty(itemArr) && itemArr[0].items.length) || 0;
      if (overlinitLength) {
        this.setState({ overlinitLength, dialogOverlimit: true, loading: false });
        return;
      } else {
        let temp = mingDaoUserInfos.map((item, index) => {
          let isSame = false;
          for (let i = 0; i < mingDaoUserInfos.length; i++) {
            if (
              item.wxUserInfo &&
              mingDaoUserInfos[i].wxUserInfo &&
              item.wxUserInfo.userId === mingDaoUserInfos[i].wxUserInfo.userId &&
              index !== i
            ) {
              isSame = true;
              break;
            }
          }
          if (isSame) {
            return { ...item, wxUserInfo: {} };
          } else {
            return item;
          }
        });
        this.setState({
          mingDaoUserInfos: temp,
          bindQWUserIds: temp.filter(item => item.wxUserInfo && item.wxUserInfo.userId).map(v => v.wxUserInfo.userId),
          logDetailItems,
          loading: false,
          showSyncDiaLog,
          isBindRelationship: false,
        });
      }
    });
  };

  stepRender = () => {
    let { intergrationType, loading } = this.state;
    return (
      <div className="pBottom100">
        {intergrationType !== 2 && (
          <div className="stepItem Relative">
            <h3 className="stepTitle Font16 Gray">{_l('1.获取对接信息')}</h3>
            {!this.state.show1 ? (
              <div
                className="showDiv flexRow valignWrapper"
                onClick={() => {
                  this.setState({
                    show1: true,
                  });
                }}
              >
                <Icon icon="sidebar-more" className="Font13 Gray_75 Right Hand" />
              </div>
            ) : (
              <React.Fragment>
                <p className="mTop16 Font14 Gray_75">{_l('从企业微信后台获取对接信息，即可开始集成以及同步通讯录')}</p>
                <Link to={`/wxappSyncCourse/${Config.projectId}`} target="_blank" className="mTop16 Font14 howApply">
                  {_l('如何获取对接信息？')}
                </Link>
              </React.Fragment>
            )}
          </div>
        )}
        <div className="stepItem Relative">
          <h3 className="stepTitle Font16 Gray">{intergrationType === 2 ? _l('1.对接信息') : _l('2.对接信息录入')}</h3>
          {!this.state.show2 && intergrationType !== 2 && (
            <div
              className="showDiv flexRow valignWrapper"
              onClick={() => {
                this.setState({
                  show2: true,
                });
              }}
            >
              <Icon icon="sidebar-more" className="Font13 Gray_75 Right Hand" />
            </div>
          )}
          {((this.state.isHasInfo && this.state.show2) || intergrationType === 2) && (
            <span className="Font13 Gray_75 Right closeDing">
              <span
                className="mLeft10 switchBtn tip-bottom-left"
                data-tip={_l('关闭企业微信集成后，无法再从企业微信处进入应用')}
              >
                <Switch
                  checked={!this.state.isCloseDing}
                  onClick={checked => {
                    this.editDingStatus(checked ? 2 : 1);
                  }}
                />
              </span>
            </span>
          )}
          {((!this.state.isCloseDing && this.state.show2) || intergrationType === 2) && (
            <React.Fragment>
              {intergrationType !== 2 && (
                <p className="mTop16 Font14 Gray_75">
                  {_l('完成步骤 1 后，填入CorpId、AgentId、Secret后可对接应用与同步通讯录')}
                </p>
              )}
              <div className="mTop25 infoList">
                <ul>
                  <li>{this.inputRender('CorpId', 600, 1)}</li>
                  <li className="mTop16">{this.inputRender('AgentId', 600, 2)}</li>
                  <li className="mTop16">{this.inputRender('Secret', 600, 3, 4)}</li>
                </ul>
              </div>
              {intergrationType !== 2 && (
                <div className="TxtRight mTop30">
                  {!this.state.canEditInfo ? (
                    <Button
                      type="primary"
                      className="editInfo"
                      onClick={e => {
                        this.setState({
                          canEditInfo: true,
                        });
                      }}
                    >
                      {_l('编辑')}
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      className="saveInfo"
                      onClick={e => {
                        this.editInfo();
                      }}
                    >
                      {_l('保存')}
                    </Button>
                  )}
                </div>
              )}
            </React.Fragment>
          )}
        </div>
        <div className="stepItem">
          <h3 className="stepTitle Font16 Gray">{_l('%0数据同步', intergrationType !== 2 ? '3.' : '2.')}</h3>
          <div className="mTop16 syncBox">
            <span className="Font14 syncTxt Gray_75">{_l('从企业微信通讯录同步到该系统')}</span>
            <Button
              type="primary"
              disabled={loading}
              className={cx('syncBtn', {
                isNO:
                  (this.state.canEditInfo && !this.state.isHasInfo) ||
                  this.state.isCloseDing ||
                  this.state.showSyncDiaLog,
              })}
              onClick={e => {
                if (
                  (this.state.canEditInfo && !this.state.isHasInfo) ||
                  this.state.isCloseDing ||
                  this.state.showSyncDiaLog
                ) {
                  return;
                } else {
                  this.checkSyncFn(true);
                }
              }}
            >
              {loading ? _l('正在计算，请稍等') : _l('同步')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  editWXProjectSettingStatus = (tag, callback) => {
    // 状态：0 提交申请；2关闭集成；1重新开启集成 tag
    Ajax.editWXProjectSettingStatus({
      projectId: Config.projectId,
      status: tag,
    }).then(res => {
      if (res) {
        callback();
      } else {
        alert('失败');
      }
    });
  };
  changeTab = key => {
    if (key === 'other') {
      this.getInitialPassword();
    }
  };
  handleChangeCustomMappingFieldEnabled = checked => {
    Ajax.editWXProjectMappingFieldEnabled({
      projectId: Config.projectId,
      status: checked ? 0 : 1,
    }).then(res => {
      if (res) {
        this.setState({
          customMappingFieldEnabled: !checked,
        });
      }
    });
  };
  changeSyncWXLabel = value => {
    Ajax.editWXProjectTagMappingField({
      projectId: Config.projectId,
      fieldName: value,
    }).then(res => {
      if (res) {
        this.setState({ syncWXLabel: value });
      } else {
        alert(_l('操作失败'));
      }
    });
  };
  syncWXLabel = checked => {
    Ajax.editWXProjectTagMappingField({
      projectId: Config.projectId,
      fieldName: checked ? '' : this.state.syncWXLabel,
    }).then(res => {
      if (res) {
        this.setState({ syncWXLabelChecked: !checked });
      } else {
        alert(_l('操作失败'));
      }
    });
  };
  render() {
    let {
      isPassApply,
      intergrationType,
      syncWXLabel,
      mingDaoUserInfos = [],
      bindQWUserIds = [],
      logDetailItems = [],
    } = this.state;
    const featureType = getFeatureStatus(Config.projectId, FEATURE_ID);
    if (featureType === '2') {
      return <UpgradeVersion projectId={Config.projectId} featureId={FEATURE_ID} />;
    }
    if (this.state.pageLoading) {
      return <LoadDiv className="mTop80" />;
    }
    return (
      <div className="workwxMainContent">
        {!this.state.isPassApply && !(!this.state.CorpId && !md.global.Config.IsLocal) && intergrationType !== 2 ? (
          <div className="TxtMiddle">
            <div className="TxtCenter logoBox">
              {this.state.isReject ? (
                <React.Fragment>
                  <Icon icon="closeelement-bg-circle" className="Red iconReject" />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <span className="mdIcon">
                    <Icon icon="feed" className="Font40 White" />
                  </span>
                  <Icon icon="swap_horiz" className="Font36 mLeft30 mRight30 Gray_bd" />
                  <Icon icon="invite-ding" className="TxtCenter" />
                </React.Fragment>
              )}
            </div>
            {!this.state.hasApply ? (
              <div className="TxtCenter mTop50">
                <h2 className="Font26 Gray">{_l('申请企业微信集成')}</h2>
                <p className="mTop24 mBottom32 Font16 Gray_75">
                  {_l('申请通过后，可将该系统应用安装到企业微信工作台！')}
                </p>
                <Button
                  type="primary"
                  className="applyBtn mBottom10"
                  onClick={e => {
                    // 提交申请
                    this.editWXProjectSettingStatus(0, () => {
                      this.setState({
                        hasApply: true,
                      });
                    });
                  }}
                >
                  {_l('立即申请')}
                </Button>
              </div>
            ) : (
              <div className="TxtCenter mTop50">
                {this.state.isReject ? (
                  <React.Fragment>
                    <h2 className="Font18 Gray">{_l('试用已过期，请付费后继续使用')}</h2>
                    <p className="mTop15 Font13 Gray_75">{_l('如有疑问，请联系您的专属顾问')}</p>
                    <Button
                      type="primary"
                      className="applyBtn mBottom10 mTop25"
                      onClick={e => {
                        // 前往付费
                        navigateTo(`/upgrade/choose?projectId=${Config.projectId}`);
                      }}
                    >
                      {_l('前往付费')}
                    </Button>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <h2 className="Font26 Gray">{_l('申请已提交')}</h2>
                    <p className="mTop24 mBottom32 Font16 Gray_75">
                      {_l('预计两个工作日反馈信息，如有疑问，请联系您的专属顾问')}
                    </p>
                  </React.Fragment>
                )}
              </div>
            )}
          </div>
        ) : (
          <Tabs
            defaultActiveKey="base"
            className={cx({ tabStyle: !this.state.status === 1 })}
            onChange={this.changeTab}
          >
            <Tabs.TabPane tab={_l('企业微信集成')} key="base" className="tabStyles">
              {!this.state.CorpId && !md.global.Config.IsLocal && (this.state.status === 0 || !this.state.status) ? (
                <BuildAppNewRules
                  editWXProjectSettingStatus={this.editWXProjectSettingStatus}
                  isPassApply={isPassApply}
                  stepRender={this.stepRender}
                  status={this.state.status}
                />
              ) : (
                this.stepRender()
              )}
            </Tabs.TabPane>
            {(this.state.status === 1 || intergrationType === 2) && (
              <Tabs.TabPane tab={_l('扫码登录与同步')} key="other">
                {
                  <div className="stepItem flexRow valignWrapper">
                    <div className="flex">
                      <h3 className="stepTitle Font16 Gray mBottom24">{_l('企业微信扫码登录')}</h3>
                      <Switch
                        disabled={
                          (this.state.canEditInfo && !this.state.isHasInfo) ||
                          this.state.isCloseDing ||
                          this.state.showSyncDiaLog
                        }
                        checked={this.state.intergrationScanEnabled}
                        onClick={this.handleChangeScanEnabled}
                      />
                      <div className="mTop16 syncBox">
                        <span className="Font14 Gray_75">{_l('开启后，可使用企业微信扫一扫，直接登录')}</span>
                      </div>
                      {intergrationType !== 2 ? (
                        <Link
                          to={`/wxappSyncCourse/${Config.projectId}#scanWorkwx`}
                          target="_blank"
                          className="mTop16 Font14 howApply"
                        >
                          {_l('如何实现企业微信扫码登录？')}
                        </Link>
                      ) : (
                        <a
                          target="_blank"
                          href="https://help.mingdao.com/Wecom3.html#%E4%BA%8C%E3%80%81%E5%9C%A8%E6%98%8E%E9%81%93%E4%BA%91%E4%BA%8C%E7%BA%A7%E7%99%BB%E5%BD%95%E9%A1%B5%E9%9D%A2%EF%BC%8C%E4%BD%BF%E7%94%A8%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E6%89%AB%E7%A0%81%E7%99%BB%E5%BD%95"
                          className="helpEntry"
                        >
                          {_l('如何实现企业微信扫码登录？')}
                        </a>
                      )}
                    </div>
                  </div>
                }
                {md.global.Config.IsLocal && (
                  <IntegrationSetPssword
                    password={this.state.password}
                    isSetPassword={this.state.isSetPassword}
                    disabled={
                      (this.state.canEditInfo && !this.state.isHasInfo) ||
                      this.state.isCloseDing ||
                      this.state.showSyncDiaLog
                    }
                  />
                )}
                <div className="stepItem flexRow valignWrapper">
                  <div className="flexColumn flex">
                    <h3 className="stepTitle Font16 Gray">{_l('企业微信字段同步')}</h3>
                    <div className="mTop16 syncBox mBottom24">
                      <span className="Font14 Gray_75">
                        {_l(
                          '完成通讯录同步的基础配置后，可将企业微信用户账号或者企业微信自定义信息字段同步到系统的工号字段',
                        )}
                      </span>
                    </div>
                    <div className="flexRow alignItemsCenter mBottom16 syncRow height32">
                      <Checkbox checked={this.state.syncWXLabelChecked} onClick={this.syncWXLabel}>
                        {_l('同步企业微信标签')}
                      </Checkbox>
                      {this.state.syncWXLabelChecked && (
                        <span className="mLeft110">
                          {_l('同步到')}
                          <Select
                            style={{ width: 180, margin: '0 10px' }}
                            value={syncWXLabel}
                            onChange={this.changeSyncWXLabel}
                          >
                            <Option value={'organize'}>{_l('组织角色')}</Option>
                            <Option value={'job'}>{_l('职位')}</Option>
                          </Select>
                          {_l('字段')}
                        </span>
                      )}
                    </div>
                    <div className="syncRow mBottom8">
                      <Checkbox
                        checked={this.state.customMappingFieldEnabled}
                        onClick={this.handleChangeCustomMappingFieldEnabled}
                      >
                        {_l('同步企业微信用户账号 或 自定义信息字段 到工号字段')}
                      </Checkbox>
                    </div>
                    <div className="Gray_9e mLeft32">
                      {_l('企业微信用户账号和企业微信自定义字段只可选择一个同步到工号字段')}
                    </div>
                    {this.state.customMappingFieldEnabled && (
                      <div className="mLeft32">
                        <div className="flexRow">
                          <Radio.Group
                            className="radioGroupWrapper"
                            onChange={this.handleChangeJobnumberMappingField}
                            value={this.state.fieldRadio}
                          >
                            <Radio className="Block" value="workxeixinapp-userid">
                              <span className="width225"> {_l('企业微信用户账号')}</span>
                            </Radio>
                            <Radio className="Block" value="customField">
                              <span className="width225">{_l('企业微信自定义信息字段')}</span>
                            </Radio>
                          </Radio.Group>
                          <div className="pTop15">
                            <div>
                              <span>{_l('同步到工号字段')}</span>
                            </div>
                            <div>
                              <span>{_l('同步到工号字段')}</span>
                              <Link
                                to={`/wxappSyncCourse/${Config.projectId}#syncField`}
                                target="_blank"
                                className="mTop16 Font14 howApply mLeft10"
                              >
                                {_l('如何同步？')}
                              </Link>
                            </div>
                          </div>
                        </div>
                        {this.state.fieldRadio == 'customField' && (
                          <div className="flexRow customFieldWrapper mTop12 mLeft25">
                            <Input
                              className="mRight12"
                              value={this.state.jobnumberMappingField}
                              onChange={event => {
                                this.setState({
                                  jobnumberMappingField: event.target.value,
                                });
                              }}
                            />
                            <Button type="primary" onClick={this.handleSaveJobnumberMappingField}>
                              {_l('保存')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Tabs.TabPane>
            )}
            {intergrationType === 2 && this.state.status === 1 && (
              <Tabs.TabPane tab={_l('接口许可')} key="interfaceLicense">
                <InterfaceLicense projectId={Config.projectId} />
              </Tabs.TabPane>
            )}
          </Tabs>
        )}
        <SyncDialog
          getCount={this.getCount}
          visible={this.state.showSyncDiaLog}
          isBindRelationship={this.state.isBindRelationship}
          projectId={Config.projectId}
          onCancel={() => {
            this.setState({ showSyncDiaLog: false, isBindRelationship: undefined });
          }}
          mingDaoUserInfos={mingDaoUserInfos}
          bindQWUserIds={bindQWUserIds}
          logDetailItems={logDetailItems}
        />
        {this.renderOverLinitDialog()}
      </div>
    );
  }
}

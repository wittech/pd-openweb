import React, { useEffect } from 'react';
import { Dropdown } from 'ming-ui';
import styled from 'styled-components';
import { getWorksheetInfo } from 'src/api/worksheet';
import { getWorksheetsByAppId } from 'src/api/homeApp';
import { getAppForManager } from 'src/api/appManagement';
import { useSetState } from 'react-use';
import update from 'immutability-helper';
import _ from 'lodash';

const SelectItem = styled.div`
  .title {
    margin: 24px 0 6px 0;
  }
  .ming.Dropdown,
  .ming.Menu {
    width: 100%;
    &.disabled {
      background-color: #f5f5f5;
      .Dropdown--input {
        &:hover {
          border-color: #ccc;
        }
      }
    }
  }
  .ming.Menu {
    max-height: 160px;
  }
`;

const initialConfig = [
  {
    text: _l('应用'),
    key: 'app',
  },
  {
    text: _l('工作表'),
    key: 'sheet',
  },
];

const idContrast = {
  app: 'appId',
  sheet: 'sheetId',
  view: 'viewId',
};

export default function SelectSheetFromApp(props) {
  const { config = initialConfig, onChange, globalSheetInfo = {} } = props;
  const { appId: currentAppId, projectId, worksheetId: sourceId } = globalSheetInfo;
  const [data, setData] = useSetState({ app: [], sheet: [], view: [] });
  const [ids, setIds] = useSetState({
    appId: currentAppId,
    sheetId: '',
    viewId: '',
    ..._.pick(props, ['appId', 'sheetId', 'viewId']),
  });
  const { appId, sheetId, viewId } = ids;

  useEffect(() => {
    getAppForManager({ projectId, type: 0 }).then(res => {
      let selectAppId = '';
      const getFormatApps = () => {
        const currentIndex = _.findIndex(res, item => item.appId === currentAppId);
        const currentApp = currentIndex > -1 ? res[currentIndex] : [];
        const appList = [currentApp].concat(update(res, { $splice: [[currentIndex, 1]] }));
        if (appList.length < 1) return [];
        if (sheetId) {
          appList.forEach(i => {
            if (_.find(i.workSheetInfo || [], w => w.workSheetId === sheetId)) {
              selectAppId = i.appId;
            }
          });
        }
        return appList.map(({ appName, appId }) =>
          appId === currentAppId
            ? { text: _l('%0  (本应用)', appName), value: appId }
            : { text: appName, value: appId },
        );
      };
      setData({ app: getFormatApps() });
      if (selectAppId) {
        setIds({ appId: selectAppId });
      }
    });
  }, []);

  useEffect(() => {
    if (!appId) return;
    getWorksheetsByAppId({ appId, type: 0 }).then(res => {
      setData({
        sheet: res.map(({ workSheetId: value, workSheetName: text }) =>
          value === sourceId ? { text: _l('%0  (本表)', text), value } : { text, value },
        ),
      });
    });
  }, [appId]);

  useEffect(() => {
    if (!sheetId) return;
    const viewConfig = _.find(config, item => item.key === 'view');
    if (!viewConfig) return;
    getWorksheetInfo({ worksheetId: sheetId, getViews: true, appId }).then(res => {
      const views = viewConfig.filter ? _.filter(res.views, viewConfig.filter) : res.views;
      const view = views.map(({ viewType, name, viewId }) => ({
        viewType,
        value: viewId,
        text: name,
      }));
      setData({ view });
      if (!viewId && !_.isEmpty(view)) {
        const firstViewId = _.head(view).value;
        setIds({ viewId: firstViewId });
        onChange({ viewId: firstViewId });
      }
    });
  }, [sheetId]);

  return config.map(({ text, key, disabled, filter = item => item }) => (
    <SelectItem key={key}>
      <div className="title Bold">{text}</div>
      <Dropdown
        value={ids[idContrast[key]] || undefined}
        border
        openSearch
        isAppendToBody
        placeholder={_l('请选择')}
        disabled={disabled}
        data={_.filter(data[key], filter)}
        onChange={value => {
          if (key === 'app') {
            setIds({ appId: value, sheetId: '', viewId: '' });
            onChange({ appId: value, sheetId: '', viewId: '' });
            return;
          }
          setIds({
            ..._.pick(props, ['appId', 'sheetId', 'viewId']),
            [idContrast[key]]: value,
          });
          if (key === 'sheet') {
            const { text: sheetName } = data.sheet.find(item => item.value === value) || {};
            onChange({
              ..._.pick(props, ['appId', 'sheetId', 'viewId']),
              [idContrast[key]]: value,
              sheetName,
            });
            return;
          }

          onChange({
            ..._.pick(props, ['appId', 'sheetId', 'viewId']),
            [idContrast[key]]: value,
          });
        }}
      />
    </SelectItem>
  ));
}

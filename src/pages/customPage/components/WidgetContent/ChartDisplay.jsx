import React, { useEffect, useState } from 'react';
import Card from 'statistics/Card';
import { connect } from 'react-redux';
import { formatFiltersGroup } from 'src/pages/customPage/components/editWidget/filter/util';

const ChartDisplay = props => {
  const { widget, filtersGroup } = props;
  const objectId = _.get(widget, 'config.objectId');
  const filters = formatFiltersGroup(objectId, filtersGroup);
  return (
    <Card {...props} filtersGroup={filters.length ? filters : undefined} />
  );
}

export default connect(
  state => ({
    filtersGroup: state.customPage.filtersGroup
  })
)(ChartDisplay);

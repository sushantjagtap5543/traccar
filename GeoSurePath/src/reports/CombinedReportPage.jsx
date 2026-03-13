import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import { formatTime } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import MapMarkers from '../map/MapMarkers';
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';

const CombinedReportPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('sharedDevice')}</TableCell>
                <TableCell>{t('reportTripCount') || 'Trips'}</TableCell>
                <TableCell>{t('reportTotalDistance') || 'Distance (km)'}</TableCell>
                <TableCell>{t('reportTotalDuration') || 'Duration (h)'}</TableCell>
                <TableCell>{t('reportMaxSpeed') || 'Max Speed (kph)'}</TableCell>
                <TableCell>{t('reportIdleEvents') || 'Idle Incidents'}</TableCell>
                <TableCell>{t('reportIdleDuration') || 'Idle Time (min)'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.map((item) => (
                  <TableRow key={item.deviceid}>
                    <TableCell>{item.devicename}</TableCell>
                    <TableCell>{item.trip_count}</TableCell>
                    <TableCell>{item.total_distance_km}</TableCell>
                    <TableCell>{item.total_duration_hours}</TableCell>
                    <TableCell>{item.max_speed_kph}</TableCell>
                    <TableCell>{item.idle_incidents}</TableCell>
                    <TableCell>{item.total_idle_minutes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={7} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default CombinedReportPage;

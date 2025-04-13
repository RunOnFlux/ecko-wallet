import moment from 'moment';
import { getSelectedNetwork } from 'src/stores/slices/extensions';
import { useAppSelector } from 'src/stores/hooks';

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const useGetData = () => {
  const selectedNetwork = useAppSelector(getSelectedNetwork);

  return async (startDate: Date, endDate: Date) => {
    const start = moment(startDate).format('YYYY-MM-DD');
    const end = moment(endDate).format('YYYY-MM-DD');

    const baseUrl = 'https://api.ecko.finance/analytics/';
    const url = `${baseUrl}get-data?dateStart=${start}&dateEnd=${end}`;
    const options = { method: 'GET', headers };

    const response = await fetch(url, options);
    const json = await response.json();

    return json;
  };
};

export const useGetLastDayData = () => {
  const getData = useGetData();

  return async () => {
    const end = new Date();
    const start = moment(end).subtract(1, 'days').toDate();
    const response = await getData(start, end);

    return response;
  };
};

// GET analytics/get-data?dateStart=yesterda&dateEnd=today

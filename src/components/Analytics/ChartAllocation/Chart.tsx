import { forwardRef, useMemo } from 'react';
import styled from 'styled-components';
import ApexChart, { Props as ApexProps } from 'react-apexcharts';
import { AccountBalanceProps, TokenBalance } from 'src/contexts/AccountBalanceContext';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { IFungibleToken, IFungibleTokensByNetwork } from 'src/pages/ImportToken';
import { DivFlex, SecondaryLabel } from 'src/components';
import images from 'src/images';
import { LabeledContainer } from '../UI';
import { getTokenImageUrl } from '@Utils/constant';
import { useDexPairs } from 'src/hooks/dexPairs';

const TokensContainer = styled.div`
  display: grid;
  justify-content: start;
  align-items: start;
  grid-template-columns: 50% 50%;
  gap: 12px;
  font-size: 13px;
  color: #e6e6e6;
`;

const Token = styled.img`
  width: 20px;
  height: 20px;
  margin-right: 8px;
`;

const TokenName = styled(SecondaryLabel)`
  padding-right: 8px;
`;

const TokenPercentual = styled(SecondaryLabel)`
  font-weight: bold;
`;

const Dot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
  margin-right: 8px;
`;

const COLORS = ['#E25F5F', '#E1E794', '#877ce6', '#94AEE7', '#B7E794', '#ED1CB5', '#FD9F28', '#E794E7', '#E7E494', '#94E7DA'];

interface Props {
  allAccountsBalanceUsd: AccountBalanceProps;
  fungibleTokens: IFungibleTokensByNetwork;
}

const Chart = forwardRef<HTMLDivElement, Props>(({ allAccountsBalanceUsd, fungibleTokens }, ref) => {
  const { theme } = useAppThemeContext();
  const pairs = useDexPairs();
  const summedTokenBalance = Object.values(allAccountsBalanceUsd).reduce(
    (sumPerAccount, account) =>
      account.reduce(
        (sumPerNetwork, tokenBalance) =>
          Object.keys(tokenBalance).reduce(
            (sumPerToken, contractAddress) => ({
              ...sumPerToken,
              [contractAddress]: (sumPerToken[contractAddress] || 0) + tokenBalance[contractAddress],
            }),
            sumPerNetwork,
          ),
        sumPerAccount,
      ),
    {} as TokenBalance,
  );

  const { series, labels, addresses, total } = useMemo(() => {
    const data = Object.keys(summedTokenBalance).reduce(
      (acc, contractAddress) => {
        const sum = Number(summedTokenBalance[contractAddress]);
        if (sum === 0) return acc;

        let token: IFungibleToken | undefined;

        if (contractAddress === 'coin') {
          token = {
            contractAddress: 'coin',
            symbol: 'KDA',
          };
        } else if (fungibleTokens) {
          Object.values(fungibleTokens).every((tokens) => {
            const foundToken = tokens.find((t) => t.contractAddress === contractAddress);
            if (foundToken) {
              token = foundToken;
              return false;
            }

            return true;
          });
        }

        const symbol = token?.symbol.toUpperCase() || contractAddress;

        return {
          series: [...acc.series, sum],
          labels: [...acc.labels, symbol],
          addresses: [...acc.addresses, contractAddress],
        };
      },
      {
        series: [] as number[],
        labels: [] as string[],
        addresses: [] as string[],
      },
    );
    const totalSum = Number(data.series.reduce((acc, value) => acc + value, 0).toFixed(2));

    return {
      series: data.series,
      labels: data.labels,
      addresses: data.addresses,
      total: totalSum,
    };
  }, [summedTokenBalance, fungibleTokens]);

  const options: ApexProps['options'] = {
    chart: {
      type: 'donut',
      height: 180,
    },
    colors: COLORS,
    labels,
    stroke: {
      width: 2,
      colors: ['#1a1e3e'],
    },
    plotOptions: {
      pie: {
        customScale: 1,
        startAngle: -90,
        endAngle: 90,
        donut: {
          size: '85%',
          labels: {
            show: true,
            name: {
              offsetY: -55,
            },
            value: {
              offsetY: -45,
              color: theme.text.primary,
              fontFamily: 'Montserrat',
              fontWeight: 'bold',
              formatter: (value) => `$ ${Number(value).toFixed(2).toLocaleString()}`,
            },
            total: {
              show: true,
              color: theme.text.primary,
              fontFamily: 'Montserrat',
              label: 'TOT',
              fontWeight: 'bold',
              formatter: () => `$ ${total.toFixed(2).toLocaleString()}`,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
      position: 'bottom',
      offsetY: -45,
      labels: {
        colors: theme.text.primary,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `$ ${value.toFixed(2).toLocaleString()}`,
      },
      style: {
        fontFamily: 'Montserrat',
      },
    },
    grid: {
      padding: {
        right: 20,
        left: 20,
        bottom: -160,
      },
    },
  };

  return (
    <LabeledContainer label="CHART" ref={ref}>
      <ApexChart options={options} series={series} type="donut" height={360} />
      <TokensContainer>
        {series.map((value, index) => (
          <DivFlex key={labels[index]} alignItems="center" justifyContent="flex-start">
            <Token src={getTokenImageUrl(addresses[index])} />
            <Dot color={COLORS[index % COLORS.length]} />
            <TokenName>{labels[index]}</TokenName>
            <TokenPercentual>{((value / total) * 100).toFixed(2)}%</TokenPercentual>
          </DivFlex>
        ))}
      </TokensContainer>
    </LabeledContainer>
  );
});

export default Chart;

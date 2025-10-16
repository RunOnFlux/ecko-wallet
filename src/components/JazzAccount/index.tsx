import React from 'react';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { shortenAddress } from 'src/utils';
import { AccountType } from 'src/stores/slices/wallet';
import LedgerIcon from 'src/images/ledger-logo.svg?react';
import SpireKeyLogo from 'src/images/spirekey-logo.svg?react';
import styled from 'styled-components';
import { DivFlex } from '..';

const AccountListWrapper = styled(DivFlex)`
  margin: 10px 0;
  cursor: pointer;
`;

const AccountLabel = styled.span`
  font-weight: ${(props) => (props.isSelected ? 'bold' : 500)};
  font-size: 16px;
  color: ${($props) => $props.color || $props.theme?.text?.primary || '#000000'};
`;

export const JazzAccount = ({
  account,
  diameter,
  type,
  renderAccount,
  isSelected,
  onClick,
}: {
  account: string;
  diameter?: number;
  type?: AccountType;
  // eslint-disable-next-line no-unused-vars
  renderAccount?: (acc: string) => React.ReactNode;
  isSelected?: boolean;
  onClick?: any;
}) =>
  account ? (
    <AccountListWrapper key={account} justifyContent="flex-start" alignItems="center" onClick={onClick}>
      {type === AccountType.LEDGER ? (
        <LedgerIcon style={{ marginRight: 11 }} />
      ) : type === AccountType.SPIREKEY ? (
        <SpireKeyLogo style={{ marginRight: 10, width: 24, height: 24, marginTop: -10 }} />
      ) : (
        <Jazzicon
          diameter={diameter || 24}
          seed={jsNumberForAddress(account)}
          paperStyles={{ marginRight: 10, border: isSelected ? '2px solid #20264e' : null, padding: !isSelected ? 1 : 0 }}
        />
      )}
      {renderAccount ? renderAccount(account) : <AccountLabel isSelected={isSelected}>{shortenAddress(account)}</AccountLabel>}
    </AccountListWrapper>
  ) : null;

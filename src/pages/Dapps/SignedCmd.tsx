import images from 'src/images';
import Pact from 'pact-lang-api';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { JsonView, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { InputError } from 'src/baseComponent';
import { getLocalSelectedNetwork, getLocalSigningCmd } from 'src/utils/storage';
import Button from 'src/components/Buttons';
import { DivFlex, SecondaryLabel } from 'src/components';
import { sendWalletConnectMessage, updateSignedCmdMessage } from 'src/utils/message';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';
import { getTimestamp } from 'src/utils';
import { ECKO_WALLET_DAPP_SIGN_NONCE, WALLET_CONNECT_SIGN_METHOD } from 'src/utils/config';
import { getSignatureFromHash } from 'src/utils/chainweb';
import { bufferToHex, useLedgerContext } from 'src/contexts/LedgerContext';
import { AccountType } from 'src/stores/slices/wallet';
import { useAppSelector } from 'src/stores/hooks';
import { useTranslation } from 'react-i18next';

export const DappWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  padding-bottom: 15px;
  font-size: 14px;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const DappContentWrapper = styled.div`
  padding: 20px;
  word-break: break-word;
  .json-view-lite {
    background: ${({ theme }) => (theme.isDark ? '#1e1e1e' : '#fff')};
    .json-view-lite-key {
      color: ${({ theme }) => theme.text.primary};
    }
  }
`;

export const DappDescription = styled.div`
  color: ${({ theme }) => theme.text.primary};
  text-align: center;
  margin: 20px 0;
`;

export const DappLogo = styled.img`
  width: 70px;
  height: 70px;
  margin: 50px auto 20px auto;
`;

export interface WalletConnectParams {
  id: number;
  topic: string;
  action: string;
}

const SignedCmd = () => {
  const { t } = useTranslation();
  const [domain, setDomain] = useState('');
  const [tabId, setTabId] = useState(null);
  const [cmd, setCmd] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hash, setHash] = useState<any>('');
  const [chainId, setChainId] = useState<any>();
  const [caps, setCaps] = useState<any[]>([]);
  const [walletConnectParams, setWalletConnectParams] = useState<WalletConnectParams | null>(null);
  const { signHash, isWaitingLedger } = useLedgerContext();
  const { theme } = useAppThemeContext();
  const { publicKey, secretKey, type } = useAppSelector((state) => state.wallet);

  const returnSignedMessage = (result, error?, wcId = null, topic = null) => {
    const walletConnectId = wcId ?? walletConnectParams?.id;
    const walletConnectTopic = topic ?? walletConnectParams?.topic;
    if (walletConnectTopic) {
      sendWalletConnectMessage(walletConnectId, walletConnectTopic, result, error);
    } else {
      updateSignedCmdMessage(result, tabId);
    }
    setTimeout(() => window.close(), 300);
  };

  useEffect(() => {
    getLocalSigningCmd(
      async (signingCmd) => {
        setTabId(signingCmd?.signingCmd?.tabId);
        setChainId(signingCmd?.signingCmd?.chainId);
        if (signingCmd?.signingCmd?.walletConnectAction) {
          const { id, topic, walletConnectAction } = signingCmd?.signingCmd;
          setWalletConnectParams({ id, topic, action: walletConnectAction });
        }
        try {
          const signedResponse = await signCommand(signingCmd?.signingCmd);
          if (signedResponse?.signingCmd && signedResponse.signedCmd) {
            getLocalSelectedNetwork(
              (selectedNetwork) => {
                if (selectedNetwork.networkId === signedResponse?.signingCmd.networkId) {
                  setDomain(signedResponse?.signingCmd.domain);
                  setCmd(signedResponse?.signedCmd);
                  setCaps(signedResponse?.signingCmd.caps);
                } else {
                  setErrorMessage(t('dapps.signedCmd.invalidNetwork'));
                }
              },
              () => {},
            );
          }
        } catch (err: any) {
          setErrorMessage(err?.message ?? t('dapps.signedCmd.signingCmdError'));
        }
      },
      () => {},
    );
  }, [secretKey, type]);

  const signCommand = async (signingCmd) => {
    try {
      const meta = Pact.lang.mkMeta(
        signingCmd.sender,
        signingCmd.chainId.toString(),
        parseFloat(signingCmd.gasPrice),
        parseFloat(signingCmd.gasLimit),
        getTimestamp(),
        signingCmd.ttl,
      );

      const clist = signingCmd.caps?.map((c) => c.cap) || [];
      const keyPairs = {
        publicKey,
        ...(secretKey.length === 64 && { secretKey }),
        ...(clist.length > 0 && { clist }),
      };

      const signedCmd = Pact.api.prepareExecCmd(
        keyPairs,
        `${ECKO_WALLET_DAPP_SIGN_NONCE}-${new Date().toISOString()}`,
        signingCmd.pactCode || signingCmd.code,
        signingCmd.data || signingCmd.envData,
        meta,
        signingCmd.networkId,
      );

      if (type === AccountType.LEDGER) {
        setHash(signedCmd.hash);
        const signHashResult = await signHash(signedCmd.hash);
        signedCmd.sigs = [{ sig: bufferToHex(signHashResult?.signature) }];
        return { signedCmd, signingCmd };
      }

      if (secretKey.length > 64) {
        const signature = await getSignatureFromHash(signedCmd.hash, secretKey);
        signedCmd.sigs = [{ sig: signature }];
      }

      return { signedCmd, signingCmd };
    } catch (err: any) {
      throw { status: 'fail', message: err?.message || t('dapps.signedCmd.signingCmdGenericError') };
    }
  };

  const onSave = () => {
    const result: any = walletConnectParams?.action === WALLET_CONNECT_SIGN_METHOD ? { chainId, body: cmd } : { status: 'success', signedCmd: cmd };
    returnSignedMessage(result);
  };

  const onClose = () => {
    const result = { status: 'fail', message: errorMessage || t('dapps.signedCmd.rejectedByUser') };
    returnSignedMessage(result, {
      code: 5000,
      message: errorMessage || t('dapps.signedCmd.userRejected'),
    });
  };

  const newCmd = cmd.cmd ? { ...cmd, cmd: JSON.parse(cmd.cmd) } : {};

  return (
    <DappWrapper>
      <DappLogo src={images.eckoWalletLogoRounded} alt="logo" />
      <DappDescription>{domain}</DappDescription>
      <SecondaryLabel style={{ textAlign: 'center' }} uppercase>
        {t('dapps.signedCmd.signedCommand')}
      </SecondaryLabel>
      {Object.keys(newCmd).length > 0 && (
        <DappContentWrapper>
          <JsonView data={newCmd} clickToExpandNode style={theme.isDark ? darkStyles : defaultStyles} />
        </DappContentWrapper>
      )}
      {type === AccountType.LEDGER && isWaitingLedger && (
        <DivFlex flexDirection="column" alignItems="center" padding="24px">
          <SecondaryLabel style={{ textAlign: 'center' }}>{t('dapps.signedCmd.pleaseEnableLedger')}</SecondaryLabel>
          {hash && (
            <SecondaryLabel style={{ textAlign: 'center', marginTop: 30, wordBreak: 'break-all' }}>
              {t('dapps.signedCmd.hashToSign')}
              <br />
              {hash}
            </SecondaryLabel>
          )}
        </DivFlex>
      )}
      {!isWaitingLedger && caps?.length > 0 && (
        <>
          <SecondaryLabel style={{ textAlign: 'center' }}>{t('dapps.signedCmd.capabilities')}</SecondaryLabel>
          <DivFlex flexDirection="column">
            {caps.map((cap, i) => (
              <DappContentWrapper key={i}>
                <JsonView data={cap} clickToExpandNode style={theme.isDark ? darkStyles : defaultStyles} />
              </DappContentWrapper>
            ))}
          </DivFlex>
        </>
      )}
      {!isWaitingLedger && (
        <>
          <DivFlex gap="10px" padding="24px">
            <InputError>{errorMessage}</InputError>
          </DivFlex>
          <DivFlex gap="10px" padding="24px">
            <Button
              size="full"
              label={errorMessage ? t('dapps.signedCmd.close') : t('dapps.signedCmd.reject')}
              variant="disabled"
              onClick={onClose}
            />
            {!errorMessage && <Button isDisabled={isWaitingLedger} size="full" label={t('dapps.signedCmd.confirm')} onClick={onSave} />}
          </DivFlex>
        </>
      )}
    </DappWrapper>
  );
};

export default SignedCmd;

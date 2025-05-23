import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import styled from 'styled-components';
import { BaseTextInput } from 'src/baseComponent';
import Button from 'src/components/Buttons';
import { toast } from 'react-toastify';
import Toast from 'src/components/Toast/Toast';
import { CommonLabel, DivFlex, SecondaryLabel } from 'src/components';
import images from 'src/images';
import { getSignatureFromHash, getSignatureFromHashWithPrivateKey64 } from 'src/utils/chainweb';
import { AccountType } from 'src/stores/slices/wallet';
import { bufferToHex, useLedgerContext } from 'src/contexts/LedgerContext';
import { useAppSelector } from 'src/stores/hooks';

export const Icon = styled.img`
  cursor: pointer;
`;

export const HashSignModal = () => {
  const { t } = useTranslation();
  const { publicKey, secretKey, type } = useAppSelector((state) => state.wallet);

  const [hash, setHash] = useState('');
  const [signature, setSignature] = useState('');
  const { signHash } = useLedgerContext();

  const onCopy = (str: string) => {
    navigator.clipboard.writeText(str);
    toast.success(<Toast type="success" content={t('hashSignModal.copied')} />);
  };

  return (
    <>
      <div style={{ padding: '24px', paddingBottom: 0 }}>
        <div style={{ marginBottom: 30 }}>
          <DivFlex justifyContent="space-between" alignItems="center" style={{ marginBottom: 10 }}>
            <SecondaryLabel fontSize={10}>{t('hashSignModal.publicKey')}</SecondaryLabel>
            <Icon src={images.wallet.copyGray} onClick={() => onCopy(publicKey)} />
          </DivFlex>
          <DivFlex justifyContent="flex-start" alignItems="flex-start">
            <Jazzicon diameter={24} seed={jsNumberForAddress(publicKey)} paperStyles={{ marginRight: 5, minWidth: 24 }} />
            <CommonLabel wordBreak="break-word">{publicKey}</CommonLabel>
          </DivFlex>
        </div>
      </div>
      <div style={{ padding: 24, borderTop: '1px solid #dfdfed' }}>
        <SecondaryLabel fontSize={10} margin="10px 0px" style={{ display: 'block' }}>
          {t('hashSignModal.transactionHash')}
        </SecondaryLabel>
        <BaseTextInput
          inputProps={{ value: hash || '', placeholder: t('hashSignModal.insertTransactionHash') }}
          title=""
          height="auto"
          onChange={(e) => {
            setHash(e.target.value);
          }}
        />
        {signature && (
          <>
            <DivFlex justifyContent="space-between" alignItems="center" margin="20px 0px 10px 0px">
              <SecondaryLabel fontSize={10}>{t('hashSignModal.signature')}</SecondaryLabel>
              <Icon src={images.wallet.copyGray} onClick={() => onCopy(signature)} />
            </DivFlex>
            <DivFlex justifyContent="flex-start" alignItems="flex-start">
              <CommonLabel wordBreak="break-word">{signature}</CommonLabel>
            </DivFlex>
          </>
        )}
        <DivFlex justifyContent="space-between" alignItems="center" gap="10px" padding="10px 0px" marginTop="40px">
          <Button
            label={t('hashSignModal.clean')}
            size="full"
            variant="grey"
            onClick={() => {
              setHash('');
              setSignature('');
            }}
          />
          <Button
            type="submit"
            label={t('hashSignModal.sign')}
            size="full"
            onClick={async () => {
              if (hash) {
                let signatureOutput: any;
                if (type === AccountType.LEDGER) {
                  signHash(hash)
                    .then((signHashResult) => {
                      setSignature(bufferToHex(signHashResult?.signature));
                    })
                    .catch(() => {
                      setHash('');
                      setSignature('');
                    });
                } else if (secretKey.length > 64) {
                  signatureOutput = await getSignatureFromHash(hash, secretKey);
                  setSignature(signatureOutput);
                } else {
                  try {
                    signatureOutput = getSignatureFromHashWithPrivateKey64(hash, { secretKey, publicKey });
                  } catch (err) {
                    console.error('err', err);
                  }
                  setSignature(signatureOutput ?? '');
                }
              }
            }}
          />
        </DivFlex>
      </div>
    </>
  );
};

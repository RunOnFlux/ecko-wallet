import { useHistory } from 'react-router-dom';
import images from 'src/images';
import styled from 'styled-components';
import Button from 'src/components/Buttons';
import AlertIconSVG from 'src/images/icon-alert.svg?react';
import { useEffect, useRef, useState } from 'react';
import { Radio } from 'src/components/Radio';
import { toast } from 'react-toastify';
import { NavigationHeader } from 'src/components/NavigationHeader';
import Toast from 'src/components/Toast/Toast';
import { DivFlex, SecondaryLabel } from 'src/components';
import { generateSeedPhrase, getKeyPairsFromSeedPhrase } from 'src/utils/chainweb';
import { setIsHaveSeedPhrase } from 'src/stores/slices/extensions';
import { encryptKey } from 'src/utils/security';
import { getLocalWallets, setLocalSeedPhrase, setLocalSelectedWallet, setLocalWallets } from 'src/utils/storage';
import { setCurrentWallet, setWallets } from 'src/stores/slices/wallet';
import { Warning } from '../SendTransactions/styles';
import { SPWrapper } from '../Setting/ExportSeedPhrase';
import { useAppSelector } from 'src/stores/hooks';
import { useTranslation } from 'react-i18next';
import { splitSeedPhrase } from 'src/utils/seedPhrase';

const Footer = styled.div`
  margin: 20px 0;
  display: flex;
  justify-content: space-between;
`;
const Wrapper = styled.div`
  padding: 0 24px;
  text-align: center;
  font-size: 16px;
  word-break: break-word;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
`;

const SPBlackDrop = styled.div`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  align-items: center;
  position: absolute;
  cursor: pointer;
  justify-content: center;
`;
const Title = styled.div`
  color: ${({ theme }) => theme.text.primary};
  font-weight: 700;
  font-size: 24px;
  line-height: 25px;
  text-align: center;
  margin: 30px 0;
`;
const Text = styled.div`
  margin-bottom: ${(props) => (props.isLast ? '0' : '30px')};
`;
const LockImage = styled.img`
  width: 28px;
  height: 35px;
`;
const CheckboxWrapper = styled.div`
  margin-top: 40px;
`;
const VerifyWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-content: space-between;
  justify-content: space-between;
  margin-top: 40px;
`;
const ItemWrapper = styled.div`
  color: ${({ theme }) => theme.text.primary};
  text-align: center;
  width: 22%;
`;
// 13px monospace fits the longest (8-letter) words in a popup-width box; 16px cut them off.
const SInput = styled.input`
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  font-size: 13px;
  border: 1px solid ${({ theme }) => theme.text.primary};
  padding: 13px 0;
  border-radius: 8px;
  margin: 10px 0 25px 0;
  outline: none;
  background: none;
  color: ${({ theme }) => theme.text.primary};
`;
const SPText = styled.div`
  ${(props) => (props.isBlur ? 'filter: blur(4px);' : '')};
  font-weight: 400;
  line-height: 40px;
  font-size: 24px;
  font-family: monospace;
`;
const WORD_COUNT = 12;
const defaultArr: string[] = Array(WORD_COUNT).fill('');

const SeedPhrase = () => {
  const history = useHistory();
  const { passwordHash, selectedNetwork } = useAppSelector((state) => state.extensions);
  const [keyPairs, setKeyPairs] = useState<any>();
  const [step, setStep] = useState(1);
  const [sPMap, setSPMap] = useState<string[]>(defaultArr);
  const [isChecked, setIsChecked] = useState(false);
  const [enable, setEnable] = useState(false);
  const [isHiddenSP, setIsHiddenSP] = useState(true);
  const [sP, setSP] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const wordInputs = useRef<(HTMLInputElement | null)[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const initSeedPhrase = async () => {
      try {
        const seedPhrase = generateSeedPhrase();
        setSP(seedPhrase);
        const newKeyPairs = await getKeyPairsFromSeedPhrase(seedPhrase, 0);
        setKeyPairs(newKeyPairs);
      } catch (error) {
        console.error('Error generating key pairs:', error);
        toast.error(<Toast type="fail" content={t('seedPhrase.errorGeneratingKeys')} />);
      } finally {
        setIsLoading(false);
      }
    };
    initSeedPhrase();
  }, [t]);

  const goToSignIn = () => {
    toast.success(<Toast type="success" content={t('seedPhrase.successVerify')} />);
    history.push('/sign-in');
  };

  const onNext = async () => {
    if (step === 1) {
      if (isChecked) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!isHiddenSP) {
        setStep(3);
      }
    } else if (enable) {
      try {
        const newSP = sPMap.join(' ');
        if (newSP.trim() === sP) {
          if (!keyPairs) {
            throw new Error('Key pairs not generated');
          }

          const { publicKey, secretKey } = keyPairs;
          const accountName = `k:${publicKey}`;
          const wallet = {
            account: encryptKey(accountName, passwordHash),
            publicKey: encryptKey(publicKey, passwordHash),
            secretKey: encryptKey(secretKey, passwordHash),
            chainId: '0',
            connectedSites: [],
          };

          await Promise.all([
            new Promise<void>((resolve) => {
              getLocalWallets(
                selectedNetwork.networkId,
                (item) => {
                  const newData = [...item, wallet];
                  setLocalWallets(selectedNetwork.networkId, newData);
                  resolve();
                },
                () => {
                  setLocalWallets(selectedNetwork.networkId, [wallet]);
                  resolve();
                },
              );
            }),
            new Promise<void>((resolve) => {
              getLocalWallets(
                'testnet04',
                (item) => {
                  const newData = [...item, wallet];
                  setLocalWallets('testnet04', newData);
                  resolve();
                },
                () => {
                  setLocalWallets('testnet04', [wallet]);
                  resolve();
                },
              );
            }),
          ]);

          const newStateWallet = {
            chainId: '0',
            account: accountName,
            publicKey,
            secretKey,
            connectedSites: [],
          };
          const newWallets = [newStateWallet];
          setWallets(newWallets);
          setLocalSelectedWallet(wallet);
          setCurrentWallet(newStateWallet);
          const seedPhraseHash = encryptKey(sP, passwordHash);
          setIsHaveSeedPhrase(true);
          setLocalSeedPhrase(seedPhraseHash);
          goToSignIn();
        } else {
          toast.error(<Toast type="fail" content={t('seedPhrase.invalidPhrase')} />);
        }
      } catch (error) {
        console.error('Error creating wallet:', error);
        toast.error(<Toast type="fail" content={t('seedPhrase.errorCreatingWallet')} />);
      }
    }
  };

  const goBack = () => {
    setStep(step - 1);
  };

  const showSP = () => {
    setIsHiddenSP(false);
  };

  const onDownload = () => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(sP)}`);
    element.setAttribute('download', 'secret-recovery-phrase');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isFullSP = (arr) => {
    return arr.every((word) => word);
  };

  const updateWords = (newSP: string[]) => {
    setSPMap(newSP);
    setEnable(isFullSP(newSP));
  };

  // Several words at once (pasted, or typed with spaces) fill the boxes from this one onwards. A whole phrase
  // fills every box from the first, whichever box it was pasted into.
  const fillWords = (words: string[], index: number) => {
    const start = words.length >= WORD_COUNT ? 0 : index;
    const newSP = [...sPMap];
    words.slice(0, WORD_COUNT - start).forEach((word, i) => {
      newSP[start + i] = word;
    });
    updateWords(newSP);
    const lastFilled = Math.min(start + words.length, WORD_COUNT) - 1;
    wordInputs.current[Math.min(lastFilled + 1, WORD_COUNT - 1)]?.focus();
  };

  const onChangeSP = (value: string, index: number) => {
    const words = splitSeedPhrase(value);
    if (words.length > 1) {
      fillWords(words, index);
      return;
    }
    const newSP = [...sPMap];
    newSP[index] = words[0] || '';
    updateWords(newSP);
    // A space after a word moves on to the next box.
    if (words.length === 1 && /\s$/.test(value) && index < WORD_COUNT - 1) {
      wordInputs.current[index + 1]?.focus();
    }
  };

  const onPasteSP = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const words = splitSeedPhrase(e.clipboardData.getData('text'));
    if (words.length > 1) {
      e.preventDefault();
      fillWords(words, index);
    }
  };

  const renderItem = (index: number) => (
    <ItemWrapper key={index}>
      {index + 1}
      <SInput
        type="text"
        value={sPMap[index]}
        ref={(el) => {
          wordInputs.current[index] = el;
        }}
        onChange={(e) => onChangeSP(e.target.value, index)}
        onPaste={(e) => onPasteSP(e, index)}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        style={{ fontFamily: 'monospace' }}
      />
    </ItemWrapper>
  );

  const renderVerifySP = () => {
    return <VerifyWrapper>{Array.from({ length: WORD_COUNT }, (_, i) => renderItem(i))}</VerifyWrapper>;
  };

  const renderStep1 = () => (
    <>
      <Title>{t('seedPhrase.title')}</Title>
      <Warning>
        <AlertIconSVG />
        <div style={{ flex: 1 }}>{t('seedPhrase.step1Text')}</div>
      </Warning>
      <CheckboxWrapper>
        <Radio
          isChecked={isChecked}
          label={<SecondaryLabel style={{ wordBreak: 'break-word' }}>{t('seedPhrase.step1Checkbox')}</SecondaryLabel>}
          onClick={() => setIsChecked((prev) => !prev)}
        />
      </CheckboxWrapper>
      <Footer style={{ marginTop: 50 }}>
        <Button
          size="full"
          onClick={onNext}
          isDisabled={!isChecked || isLoading}
          label={isLoading ? t('seedPhrase.generating') : t('seedPhrase.continue')}
        />
      </Footer>
    </>
  );

  const renderStep2 = () => (
    <>
      <NavigationHeader title={t('seedPhrase.title')} onBack={goBack} />
      <SPWrapper>
        <SPText isBlur={isHiddenSP}>{sP}</SPText>
        {isHiddenSP && (
          <SPBlackDrop onClick={showSP}>
            <LockImage src={images.settings.iconLockOpen} alt="lock" />
            <SecondaryLabel fontWeight={500}>{t('seedPhrase.reveal')}</SecondaryLabel>
          </SPBlackDrop>
        )}
      </SPWrapper>
      <Warning>
        <AlertIconSVG />
        <div style={{ flex: 1 }}>
          <Text>{t('seedPhrase.step2Text1')}</Text>
          <Text isLast>{t('seedPhrase.step2Text2')}</Text>
        </div>
      </Warning>
      <DivFlex gap="10px" padding="24px 0">
        <Button size="full" variant="primary" onClick={onDownload} label={t('seedPhrase.download')} />
        <Button size="full" onClick={onNext} isDisabled={isHiddenSP} label={t('seedPhrase.continue')} />
      </DivFlex>
    </>
  );

  const renderStep3 = () => (
    <>
      <NavigationHeader title={t('seedPhrase.verifyTitle')} onBack={goBack} />
      <SecondaryLabel>{t('seedPhrase.verifyInstruction')}</SecondaryLabel>
      {renderVerifySP()}
      <Footer>
        <Button size="full" onClick={onNext} isDisabled={!enable} label={t('seedPhrase.continue')} />
      </Footer>
    </>
  );

  if (isLoading) {
    return (
      <Wrapper>
        <Title>{t('seedPhrase.generatingWallet')}</Title>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </Wrapper>
  );
};

export default SeedPhrase;

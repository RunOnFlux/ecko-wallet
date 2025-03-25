import React from 'react';
import 'react-responsive-modal/styles.css';
import styled from 'styled-components';
import images from 'src/images';

const Modal = styled.div`
  position: fixed;
  bottom: -150vh;
  background-color: ${({ theme }) => theme.modalBackground};
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
  width: 100%;
  box-shadow: 0 0 4px 0px rgba(0, 0, 0, 0.15);
  left: 0;
  z-index: 10;
  transition: all 0.3s ease-out;
  bottom: 0;
`;

export const Overlay = styled.div`
  background-color: rgba(0, 0, 0, 0.55);
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  position: fixed;
  display: none;
  z-index: ${({ zIndex }) => zIndex || 5};
  display: block;
`;

const DivBody = styled.div`
  margin-bottom: 30;
  overflow-x: hidden;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-track {
    background: rgb(226, 226, 226);
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(186, 186, 186);
    border-radius: 2px;
  }
`;
const DivFooter = styled.div`
  border-top: 1px solid #dfdfed;
  padding: 1rem;
`;
const TitleHeader = styled.div`
  color: ${({ theme }) => theme?.text?.primary};
  text-align: center;
  font-weight: 700;
  margin-bottom: 15px;
  font-size: 16px;
  padding: 27px 0px;
  border-bottom: 1px solid ${({ theme }) => theme?.border};
  word-break: break-word;
  position: relative;
  ${(props) => props.roundIcon && 'padding-top: 60px'}
`;

const CloseIcon = styled.img`
  position: absolute;
  right: 25px;
  width: 12px;
  cursor: pointer;
`;

const RoundIcon = styled.div`
  height: 50px;
  border-radius: 50px;
  position: absolute;
  width: 100%;
  top: -40px;
`;

const ModalCustom = (props: Props) => {
  const { isOpen, onCloseModal, closeOnOverlayClick, title, showCloseIcon, roundIcon, bodyHeight, children, footer } = props;

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Modal closeOnOverlayClick={closeOnOverlayClick} showCloseIcon={showCloseIcon}>
        {title && (
          <TitleHeader roundIcon={roundIcon}>
            {roundIcon && <RoundIcon>{roundIcon}</RoundIcon>}
            {title}
            <CloseIcon src={images.close} alt="close" onClick={onCloseModal} />
          </TitleHeader>
        )}
        <DivBody style={{ height: bodyHeight || 'auto', maxHeight: !bodyHeight ? window.innerHeight * 0.6 : undefined }}>
          <div>{children}</div>
          <div>{footer && <DivFooter>{footer}</DivFooter>}</div>
        </DivBody>
      </Modal>
      <Overlay onClick={onCloseModal} />
    </>
  );
};
type Props = {
  isOpen: boolean;
  onCloseModal?: any;
  closeOnOverlayClick?: boolean;
  title?: React.ReactNode;
  roundIcon?: React.ReactNode;
  showCloseIcon?: boolean;
  bodyHeight?: string | number | null;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};
export default ModalCustom;

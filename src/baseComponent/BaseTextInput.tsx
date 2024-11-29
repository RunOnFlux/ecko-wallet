import React, { memo, useState } from 'react';
import styled from 'styled-components';
import images from 'src/images';
import { SecondaryLabel } from 'src/components';
import { useAppThemeContext } from 'src/contexts/AppThemeContext';

type ImageProps = {
  width: string;
  height: string;
  marginTop?: string;
  src: any;
  callback: () => void;
};
type Props = {
  title: any;
  inputProps?: any;
  height?: string;
  isTextArea?: boolean;
  subtitle?: string;
  image?: ImageProps;
  imageComponent?: React.ReactNode;
  isFlex?: boolean;
  onChange?: any;
  numberOptions?: any;
  onKeyPress?: any;
  onWheel?: any;
  onBlur?: any;
  typeInput?: String;
  wrapperStyle?: React.CSSProperties;
};
const BaseTextInput = memo(
  ({
    title,
    inputProps = {},
    isTextArea,
    subtitle,
    typeInput,
    image,
    imageComponent,
    height = '44px',
    isFlex,
    onChange,
    numberOptions,
    onKeyPress,
    onWheel,
    onBlur,
    wrapperStyle,
  }: Props) => {
    const { theme } = useAppThemeContext();
    const [type, setType] = useState('password');
    const { readOnly } = inputProps;
    let styles = {
      border: '1px solid #c4c4c4',
      background: 'none',
      color: theme.input?.color,
    };
    if (readOnly) {
      styles = {
        border: 'none',
        background: 'none',
        color: '#787B8E',
      };
    }
    const InputComponent = isTextArea ? STextArea : SInput;
    return (
      <SDivRoot height={height} isFlex={isFlex}>
        <SLabel>{title}</SLabel>
        <InputWrapper isFlex={isFlex} readOnly={readOnly} style={wrapperStyle}>
          {typeInput === 'password' ? (
            <>
              <SInput
                {...inputProps}
                border={styles.border}
                background={styles.background}
                color={styles.color}
                onChange={onChange}
                onKeyPress={onKeyPress}
                onWheel={onWheel}
                autoComplete="off"
                onBlur={onBlur}
                type={type}
              />
              <ImageWrapper>
                <SImage
                  src={type === 'password' ? images.initPage.eyeHidden : images.initPage.eye}
                  alt="image"
                  onClick={() => setType(type === 'password' ? 'text' : 'password')}
                />
              </ImageWrapper>
            </>
          ) : (
            <InputComponent
              {...inputProps}
              border={styles.border}
              background={styles.background}
              color={styles.color}
              onChange={onChange}
              onKeyPress={onKeyPress}
              onWheel={onWheel}
              autoComplete="off"
              onBlur={onBlur}
            />
          )}
          {image &&
            (imageComponent || (
              <ImageWrapper>
                <SImage {...image} src={image.src} alt="image" onClick={image.callback} />
              </ImageWrapper>
            ))}
          {numberOptions && <ImageWrapper>{numberOptions.content}</ImageWrapper>}
          {subtitle && <InputSubtitle>{subtitle}</InputSubtitle>}
        </InputWrapper>
      </SDivRoot>
    );
  },
);

const SDivRoot = styled.div<{ height?: string; isFlex?: boolean }>`
  display: block;
  height: ${($props) => $props.height};
  ${(props) => (props.isFlex ? 'display: flex' : '')};
  ${(props) => (props.isFlex ? 'margin-bottom: 10px' : '')};
  border-radius: 10px;
  width: 100%;
`;
const InputWrapper = styled.div<{ isFlex?: boolean; readOnly?: boolean; border?: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: ${(props) => props.border};
  border-radius: 8px;
  ${(props) => (props.isFlex ? 'flex-grow: 1' : '')};
  background: ${(props) => {
    if (props.readOnly !== undefined) {
      return props.readOnly ? '#ECECF5' : '#F6F6FA';
    }
    return props.theme.input.background;
  }};
`;
const InputSubtitle = styled.span`
  position: absolute;
  bottom: 7px;
  color: ${({ theme }) => theme.text.secondary};
  font-size: 12px;
  left: 13px;
  line-height: 12px;
  word-break: break-all;
  font-weight: 800;
  max-width: 85%;
`;
const ImageWrapper = styled.div`
  overflow: hidden;
  right: 2px;
  top: 3px;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  flex-shrink: 0;
`;
const SImage = styled.img`
  height: ${(props) => props.width};
  width: ${(props) => props.height};
  margin-top: ${(props) => props.marginTop};
  cursor: pointer;
`;

export const SLabel = styled(SecondaryLabel)`
  line-height: 30px;
  font-weight: 700;
  text-transform: uppercase;
`;

export const SInput = styled.input<{ background: string }>`
  width: 100%;
  background: ${(props) => props.background || props.theme.input.background};
  color: ${(props) => props.color || props.theme.input.color};
  box-sizing: border-box;
  font-size: 16px;
  height: 40px;
  border-radius: 8px;
  padding: 0 0 0 13px;
  font-family: 'Montserrat', sans-serif;
  outline: none;
  border: none;
  &::placeholder {
    color: #787b8e;
    font-weight: 500;
    font-size: 16px;
  }
`;

export const STextArea = styled.textarea<{ background: string }>`
  width: 100%;
  background: ${(props) => props.background || props.theme.input.background};
  color: ${(props) => props.color || props.theme.input.color};
  box-sizing: border-box;
  font-size: 16px;
  height: 40px;
  border-radius: 8px;
  padding: 0 0 0 13px;
  font-family: 'Montserrat', sans-serif;
  outline: none;
  border: none;
  &::placeholder {
    color: #787b8e;
    font-weight: 500;
    font-size: 16px;
  }
`;

export default BaseTextInput;

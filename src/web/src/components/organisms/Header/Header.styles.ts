import styled from 'styled-components';
import { colors, spacing, breakpoints } from '../../../styles/variables.styles';

// Header height constants for responsive design
const HEADER_HEIGHT = '64px';
const MOBILE_HEADER_HEIGHT = '56px';
const LOGO_WIDTH = '180px';
const MOBILE_LOGO_WIDTH = '140px';

// Main header container with fixed positioning and theme-aware styling
export const HeaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: ${MOBILE_HEADER_HEIGHT};
  background-color: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  border-bottom: 1px solid ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  padding: 0 ${spacing.baseUnit};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  will-change: transform;
  
  @media (min-width: ${breakpoints.tablet}) {
    height: ${HEADER_HEIGHT};
    padding: 0 calc(${spacing.baseUnit} * 2);
  }
`;

// Logo section with responsive width
export const LogoSection = styled.div`
  display: flex;
  align-items: center;
  width: ${MOBILE_LOGO_WIDTH};
  height: 100%;
  
  @media (min-width: ${breakpoints.tablet}) {
    width: ${LOGO_WIDTH};
  }

  img {
    max-width: 100%;
    height: auto;
  }
`;

// Navigation section with responsive visibility
export const NavigationSection = styled.nav`
  display: none;
  align-items: center;
  height: 100%;
  margin: 0 ${spacing.baseUnit};
  
  @media (min-width: ${breakpoints.tablet}) {
    display: flex;
    gap: calc(${spacing.baseUnit} * 2);
  }

  a {
    color: inherit;
    text-decoration: none;
    padding: calc(${spacing.baseUnit} / 2) ${spacing.baseUnit};
    border-radius: 4px;
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: ${({ theme }) => 
        theme.mode === 'dark' ? colors.hover.dark : colors.hover.light};
    }

    &:focus-visible {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
    }
  }
`;

// User section with profile, settings, and help icons
export const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: calc(${spacing.baseUnit} * 1.5);
  height: 100%;
  padding: 0 ${spacing.baseUnit};

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    border-radius: 50%;
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: ${({ theme }) => 
        theme.mode === 'dark' ? colors.hover.dark : colors.hover.light};
    }

    &:focus-visible {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  @media (min-width: ${breakpoints.tablet}) {
    gap: calc(${spacing.baseUnit} * 2);
  }
`;
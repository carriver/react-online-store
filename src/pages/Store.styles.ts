import { IconButton } from '@mui/material';
import styled from 'styled-components';

// Material UI v4 wrapped button text in a span that Landing.css's global `button span` rule
// sized at 16px with 0.4em/0.2em padding. v7 has no inner span, so the buttons carry it directly.

export const Nav = styled.div`
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 0;
`;

export const Span = styled(IconButton)`
  display: block;
  padding: calc(15px + 0.4em) calc(15px + 0.2em);
  float: right;
  text-align: center;
  margin-top: 10px;
  font-size: 16px;
  &:hover {
    text-decoration: underline;
  }
`;

export const StyledButton = styled(IconButton)`
  display: block;
  padding: calc(15px + 0.4em) calc(15px + 0.2em);
  font-size: 16px;
  float: right;
  text-align: center;
`;

// v4's Grid padded every item, which put the first row of products 14px lower; v7 uses gaps instead.
export const Wrapper = styled.div`
  clear: both;
  margin: 40px;
  margin-top: 10px;
  padding-top: 14px;
`;

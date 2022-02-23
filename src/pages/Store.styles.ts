import IconButton from '@material-ui/core/IconButton';
import styled from 'styled-components';

export const Nav = styled.div`
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 0;
`;

export const Span = styled(IconButton)`
  display: block;
  padding: 15px 15px;
  float: right;
  text-align: center;
  margin-top: 10px;
  &:hover {
    text-decoration: underline;
  }
`;

export const StyledButton = styled(IconButton)`
  display: block;
  padding: 15px 15px;
  float: right;
  text-align: center;
`;

export const Wrapper = styled.div`
  margin: 40px;
  margin-top: 10px;
`;

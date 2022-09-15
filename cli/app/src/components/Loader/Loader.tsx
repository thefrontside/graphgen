import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export function Loader(): JSX.Element {
  return (
    <Box sx={{ display: 'flex' }}>
      <CircularProgress />
    </Box>
  );
}

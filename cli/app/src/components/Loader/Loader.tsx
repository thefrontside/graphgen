import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

export function Loader(): JSX.Element {
  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress />
    </Box>
  );
}

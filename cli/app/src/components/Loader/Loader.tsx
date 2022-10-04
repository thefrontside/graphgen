import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

export function Loader({ debug }: { debug?: unknown }): JSX.Element {
  if (debug) {
    console.log(debug);
  }
  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress />
    </Box>
  );
}

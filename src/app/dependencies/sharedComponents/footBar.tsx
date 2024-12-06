import { Box, Typography } from "@mui/material";

export default function FootBar(): JSX.Element {
  return (<Box
          component = "footer"
          sx = { {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.dark",
            width: "100%",
            height: "10%"
          } }
  >
    <Typography
            sx = { {
              color: "primary.contrastText",
              paddingY: "0.1em",
              textAlign: "center",
              lineHeight: "1.5em"
            } }
    >
      2022202696程敬轩，2022202677朱天哲，2022202590姚梁浩，2022202701邓托宇  2024
    </Typography>
  </Box>);
}
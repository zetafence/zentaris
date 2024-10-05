import React from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
//import Grid from "@mui/material/Grid";

const LayoutContainer = ({ children }) => {
  return (
    <Box
      component="main"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        flexGrow: 1,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <Toolbar sx={{
        minHeight: "80px !important",
      }} />
      <Container maxWidth="100%" disableGutters={true} sx={{ p: { sm: 4, xs: 2 }, flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </Container>
    </Box>
  );
};

export default LayoutContainer;

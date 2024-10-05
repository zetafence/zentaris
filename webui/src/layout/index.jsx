import AppBar from "./AppBar";
import LayoutContainer from "./LayoutContainer";
import Box from "@mui/material/Box";

const index = ({ children, isLoggedIn }) => {
	if (!isLoggedIn) {
		return <></>;
	}
	return (
		<>
			<Box sx={{ display: "flex", }}>
				<AppBar />
				<LayoutContainer>{children}</LayoutContainer>
			</Box>
		</>
	);
};

export default index;

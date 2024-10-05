import React, { Component } from "react";
import {
	createTheme,
	ThemeProvider,
} from "@mui/material/styles";
import ScopedCssBaseline from "@mui/material/ScopedCssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { AppBar, Typography } from '@material-ui/core';
import logoIcon from "../images/zetafence.png";

// top app bar style
const appBarStyle = {
	flexGrow: 1,
	color: "#364152",
	backgroundColor: '#ffffff',
};

// Header displays header components
class Header extends Component {
	constructor(props) {
		super(props);

		this.state = {
			drawerOpen: false,
			menuOpen: false,
			anchorEl: {},
			defaultTheme: createTheme(),
		};

		this.setAnchorEl = this.setAnchorEl.bind(this);
		this.toggleDrawer = this.toggleDrawer.bind(this);
		this.handlePersonClick = this.handlePersonClick.bind(this);
		this.handlePersonMenu = this.handlePersonMenu.bind(this);
		this.handlePersonMenuClose = this.handlePersonMenuClose.bind(this);
		this.handleOrgSettingsMenu = this.handleOrgSettingsMenu.bind(this);
		this.handleGroupSettingsMenu = this.handleGroupSettingsMenu.bind(this);
		this.handleServiceKeySettingsMenu = this.handleServiceKeySettingsMenu.bind(this);
		this.handleSettingsClick = this.handleSettingsClick.bind(this);
		this.handleSettingsMenuClose = this.handleSettingsMenuClose.bind(this);
		this.handleBehavioralClick = this.handleBehavioralClick.bind(this);

		this.handleNotificationMenu = this.handleNotificationMenu.bind(this);
		this.handleNotificationClick = this.handleNotificationClick.bind(this);
		this.handleNotificationClose = this.handleNotificationClose.bind(this);
	}

	// set local states
	setAnchorEl(a) {
		this.setState({
			anchorEl: a
		});
	}

	toggleDrawer() {
		this.setState({
			drawerOpen: !this.state.drawerOpen,
		});
	}

	// person menu click
	handlePersonClick(event) {
		let { anchorEl } = this.state;
		anchorEl["person"] = event.currentTarget;
		this.setState({
			menuOpen: true,
		});
		this.setAnchorEl(anchorEl);
	}

	// person profile click
	handlePersonMenu(id) {
		if (id === "logout") {
			window.open("/logout", "_self");
		}
	}

	handlePersonMenuClose(id) {
		let { anchorEl } = this.state;
		anchorEl["person"] = null;
		this.setAnchorEl(anchorEl);
		this.setState({
			menuOpen: false,
		});
	}

	handleOrgSettingsMenu(id) {
		window.open("/settings", "_self");
	}

	handleGroupSettingsMenu(id) {
		window.open("/groups", "_self");
	}

	handleServiceKeySettingsMenu(id) {
		window.open("/servicekeys", "_self");
	}

	handleSettingsClick(event) {
		let { anchorEl } = this.state;
		anchorEl["settings"] = event.currentTarget;
		this.setAnchorEl(anchorEl);
	}

	handleSettingsMenuClose() {
		let { anchorEl } = this.state;
		anchorEl["settings"] = null;
		this.setAnchorEl(anchorEl);
	}

	// notifications
	handleNotificationMenu(id) {
	}

	// handle click of behavioral graphs
	handleBehavioralClick(event) {
		window.open("/behavioral", "_self");
	}

	handleNotificationClick(event) {
		let { anchorEl } = this.state;
		anchorEl["notification"] = event.currentTarget;
		this.setAnchorEl(anchorEl);
	}

	handleNotificationClose(id) {
		let { anchorEl } = this.state;
		anchorEl["notification"] = null;
		this.setAnchorEl(anchorEl);
	}

	render() {
		return (
			<ThemeProvider theme={this.state.defaultTheme}>
				<ScopedCssBaseline />
				<AppBar position="absolute" style={appBarStyle}>
					<Toolbar
						style={{ display: 'flex' }}
						sx={{ pr: "24px" }} // keep right padding when drawer closed
					>
						<Box
							component="img"
							className="logoicon"
							sx={{
								display: 'flex', alignItems: 'left',
								width: '80px', height: 'auto',
								boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.0)',
								marginRight: 5,
							}}
							src={logoIcon}
							alt="logo text icon"
						>
						</Box>

						{/* risk categorization */}
						<Typography variant="h4" component="div"
							style={{ flex: 2, cursor: 'pointer' }}
							sx={{
								flexGrow: 1,
								letterSpacing: '1px',
								textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
							}}
						>
							<a href="/risk" style={{ textDecoration: 'none', color: 'inherit' }}>
								Risk Categorization
							</a>
						</Typography>

						{/* Dependencies */}
						<Typography variant="h4" component="div" style={{ flex: 2 }}
							sx={{
								flexGrow: 1,
								letterSpacing: '1px',
								textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
							}}
						>
							<a href="/apps" style={{ textDecoration: 'none', color: 'inherit' }}>
								Dependencies
							</a>
						</Typography>


						{/* Attack Graphs */}
						<Typography variant="h4" component="div" style={{ flex: 2 }}
							sx={{
								flexGrow: 1,
								letterSpacing: '1px',
								textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
							}}
						>
							<a href="/attackGraphs" style={{ textDecoration: 'none', color: 'inherit' }}>
								Attack Graphs
							</a>
						</Typography>
					</Toolbar>
				</AppBar>
			</ThemeProvider >
		);
	}
}

export default Header;

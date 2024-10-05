import React, { Component } from "react";
import { withRouter } from "react-router";
import "./apps.css";
import { FetchAppsData } from '../../api';
import Paper from "@mui/material/Paper";
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

// menu item style
const menuItemStyles = {
    display: 'flex',
    padding: '10px 15px',
    lineHeight: '1.2',
    cursor: 'pointer',
    justifyContent: 'flex-start',
};

// Apps returns UX components with applications table
class Apps extends Component {
    constructor(props) {
        super(props);

        // state variables
        this.state = {
            groupItemValue: "default",      // current group
            appItems: [],                   // interim list of apps
            appItemValue: {},               // currently selected app for edit using context menu
            appItemRightClickOpen: false,   // is app right-click context menu open
            contextMenu: {},                // app context-menu details
            appEditDialogOpen: false,       // is app edit dialog open
        }

        // extract {group, profileId} from behavioral profile id
        this.fetchApps = this.fetchApps.bind(this);

        // bind local class methods
        this.setAppItems = this.setAppItems.bind(this);
        this.populateAppItems = this.populateAppItems.bind(this);

        // app edit dialog
        this.handleAppDialogClose = this.handleAppDialogClose.bind(this);
        this.handleAppEditDialogButtonCancel = this.handleAppEditDialogButtonCancel.bind(this);
        this.handleAppEditDialogButtonOk = this.handleAppEditDialogButtonOk.bind(this);
        this.closeAppDialog = this.closeAppDialog.bind(this);
        this.handleAppItemRightClick = this.handleAppItemRightClick.bind(this);
        this.handleAppItemRightClickClose = this.handleAppItemRightClickClose.bind(this);
        this.handleAppItemRightClickEdit = this.handleAppItemRightClickEdit.bind(this);
        this.handleAppItemRightClickDelete = this.handleAppItemRightClickDelete.bind(this);
        this.handleAppContextMenu = this.handleAppContextMenu.bind(this);
        this.getAppTypeView = this.getAppTypeView.bind(this);

        // app edit
        this.openAppEditDialog = this.openAppEditDialog.bind(this);
    }

    // set app items
    setAppItems(v) {
        this.setState({
            appItems: v,
        })
    }

    // populate app items into this.state.appItems[]
    populateAppItems(appItems) {
        var tempRows = [];
        appItems.forEach(app => {
            tempRows = tempRows.concat({
                id: app.id,
                type: app.type,
                name: app.name,
                description: app.description,
                entities: 0,
                created: app.created
            });
        });
        this.setAppItems(tempRows);
    }

    // fetch a list of apps given group
    fetchApps(group) {
        var prom = FetchAppsData(group);
        prom.then((value) => {
            const jsonObject = JSON.parse(value);
            const retm = jsonObject.apps;
            var apps = [];
            retm.forEach(app => {
                apps = apps.concat(app);
            });

            // fill in appItems table rows
            this.populateAppItems(apps);
            this.forceUpdate();
        });
    }

    // handle app edit dialog button ok
    handleAppEditDialogButtonOk(event) {
        this.closeAppDialog();

        var newApp = this.state.appItemValue;
        var input = document.getElementById("appId");
        if (input != null && input.value !== undefined && input.value !== "") {
            newApp.id = input.value;
        }

        input = document.getElementById("appName");
        if (input != null && input.value !== undefined && input.value !== "") {
            newApp.name = input.value;
        }

        input = document.getElementById("appDesc");
        if (input != null && input.value !== undefined && input.value !== "") {
            newApp.description = input.value;
        }
    }

    // handle app edit dialog button cancel
    handleAppEditDialogButtonCancel(event) {
        this.closeAppDialog();
    }

    // handle app edit dialog to add new app info
    handleAppEditDialogClose() {
        this.closeAppDialog();
    }

    // handle app dialog to add new app info
    handleAppDialogClose() {
        this.closeAppDialog();
    }

    // close app dialog modals
    closeAppDialog() {
        this.setState({
            appEditDialogOpen: false,
        });
    }

    // open app edit dialog modal
    openAppEditDialog() {
        this.setState({
            appEditDialogOpen: true,
        })
    }

    // get a title summary for a given app such as description, user, date, etc.
    getAppTitleInfo(item) {
        var date = new Date(Number(item.created) * 1000);
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var min = date.getMinutes();
        var sec = date.getSeconds();

        month = (month < 10 ? "0" : "") + month;
        day = (day < 10 ? "0" : "") + day;
        hour = (hour < 10 ? "0" : "") + hour;
        min = (min < 10 ? "0" : "") + min;
        sec = (sec < 10 ? "0" : "") + sec;

        const dstr = date.getFullYear() + "-" + month + "-" + day + "_" + hour + ":" + min + ":" + sec;
        const titleStr = item.description + "\n" + dstr;
        return (
            `${titleStr}`
        );
    }

    // handle app item right-click context
    handleAppItemRightClick(event) {
        this.setState({
            appItemRightClickOpen: true,
        });
    }

    // handle app item right-click context close
    handleAppItemRightClickClose(event) {
        this.setState({
            appItemRightClickOpen: false,
            contextMenu: {},
        });
    }

    // handle app item right-click context edit
    handleAppItemRightClickEdit(appItem) {
        this.handleAppItemRightClickClose(null);
        this.openAppEditDialog();
    }

    // handle app item right-click context delete
    handleAppItemRightClickDelete(appItem) {
        this.handleAppItemRightClickClose(null);
    }

    // handle app item right-click context menu
    handleAppContextMenu = (event, appItem) => {
        event.preventDefault();
        var cm = this.state.contextMenu;
        const id = appItem.id;
        if (cm[id] == null) {
            cm[id] = {
                mouseX: event.clientX + 5,
                mouseY: event.clientY - 10,
            };
        } else {
            cm = {};
        }
        this.setState({
            contextMenu: cm,
            appItemValue: appItem,
        });
    }

    // getAppTypeView returns URI specific to app type
    getAppTypeView(appType) {
        if (appType === 'secret') {
            return '/secretView';
        }
        return '/appView';
    }

    componentDidMount() {
        this.fetchApps("default");
    }

    // return Apps UX component
    render() {
        return (
            <div className="apps">
                <div className="appViewCanvas">
                    <Paper
                        elevation={12}
                        square={false}
                        style={{ overflow: 'hidden', background: "#d8d8d8" }}
                        sx={{
                            display: (this.state.appItems.length === 0 ? "none" : ""),
                            ml: 2, mr: 2,
                            boxShadow: "rgb(26 25 43 / 2%) 0px 2.8px 2.2px,rgb(26 25 43 / 2%) 0px 12.5px 10px,rgb(26 25 43 /     2%) 0px 22.3px 17.9px,rgb(26 25 43 / 3%) 0px 41.8px 33.4px,rgb(26 25 43 / 2%) 0px 100px 80px",
                            borderRadius: "0.75rem",
                            flexWrap: "wrap"
                        }}
                    >

                        <ImageList sx={{ ml: 2, mt: 2 }} cols={2} rowHeight="auto">
                            {this.state.appItems.length > 0 && this.state.appItems.map(appItem => (
                                <div onContextMenu={(event) => this.handleAppContextMenu(event, appItem)}>
                                    <ImageListItem key={appItem.id} sx={{ mt: 2, ml: 2 }}>
                                        <a
                                            href={this.getAppTypeView(appItem.type) + `/:${appItem.type}:${this.state.groupItemValue}:${appItem.id}`}
                                        >
                                            <div className={"appItemImage-" + appItem.type} ></div>
                                        </a>

                                        <ImageListItemBar
                                            title={appItem.id}
                                            subtitle={<span>{this.getAppTitleInfo(appItem)}</span>}
                                            position="below"
                                            sx={{ ml: 1 }}
                                        />
                                    </ImageListItem>

                                    <Menu
                                        id={appItem.id}
                                        open={this.state.contextMenu[appItem.id] != null}
                                        onClick={this.handleAppItemRightClickClose}
                                        anchorReference="anchorPosition"
                                        anchorPosition={
                                            this.state.contextMenu[appItem.id]
                                                ? { top: this.state.contextMenu[appItem.id].mouseY, left: this.state.contextMenu[appItem.id].mouseX }
                                                : undefined
                                        }
                                    >
                                        <MenuItem
                                            style={menuItemStyles}
                                            key="editAppItem"
                                            onClick={() => this.handleAppItemRightClickEdit({ appItem })}
                                        >
                                            <div className="appMenuEditImg" ></div>Edit Metadata
                                        </MenuItem>

                                        <MenuItem
                                            style={menuItemStyles}
                                            key="deleteAppItem"
                                            onClick={() => this.handleAppItemRightClickDelete({ appItem })}
                                        >
                                            <div className="appMenuDeleteImg" ></div>Delete App
                                        </MenuItem>
                                    </Menu>
                                </div>
                            ))}
                        </ImageList>

                        <Dialog
                            open={this.state.appEditDialogOpen}
                            onClose={this.handleAppDialogClose}
                            fullWidth
                        >
                            <DialogTitle>
                                {this.state.appItemValue.id === undefined ? "Edit App" : `Edit App - ${this.state.appItemValue.id}`}
                            </DialogTitle>
                            <DialogContent>
                                <TextField id="appId"
                                    label={this.state.appItemValue.id === undefined ? "App Id" : `App Id (${this.state.appItemValue.id})`}
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    placeholder={this.state.appItemValue.id === undefined ? "e.g. mySmartLeakDetectionApp" : `e.g. ${this.state.appItemValue.id}`}
                                    disabled={this.state.appEditDialogOpen}
                                /><p />

                                <TextField id="appName"
                                    label={this.state.appItemValue.name === undefined ? "App Name" : `App Name (${this.state.appItemValue.name})`}
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    placeholder={this.state.appItemValue.name === undefined ? "e.g. mySmartLeakDetectionApp-2022-01-31" : `e.g. ${this.state.appItemValue.name}`}
                                /><p />

                                <TextField id="appDesc"
                                    label={this.state.appItemValue.description === undefined ? "App Description" : `App Description (${this.state.appItemValue.description})`}
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    placeholder={this.state.appItemValue.description === undefined ? "e.g. Smart Water leak detection logic 2022" : `e.g. ${this.state.appItemValue.description}`}
                                /><p />

                            </DialogContent>
                            <DialogActions>
                                <Button onClick={this.handleAppEditDialogButtonCancel}>Cancel</Button>
                                <Button onClick={this.handleAppEditDialogButtonOk}>Ok</Button>
                            </DialogActions>
                        </Dialog>
                    </Paper>
                </div>
            </div >
        )
    }
}

export default withRouter(Apps);

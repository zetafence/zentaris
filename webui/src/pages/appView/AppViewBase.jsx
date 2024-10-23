import React, { Component } from "react";
import "./appView.css";
// we may include only one of these, so disable warnings
// eslint-disable-next-line
import VisualizeGraph from '../../components/graph/VisualizeGraph';
// eslint-disable-next-line
import Graph from '../../components/graph/Graph';
import AppFlow from '../../components/graph/AppFlow';
import Grid from "@mui/material/Grid";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Tooltip from '@mui/material/Tooltip';
import { EvalApp } from '../../api';

// AppViewBase returns base UX components with applications table
export default class AppViewBase extends Component {
    constructor(props) {
        super(props);

        // state variables
        this.state = {
            groupItemValue: "",        // current group
            appId: "",                 // current app id
            appEntities: [],           // list of app entities
            fromentities: [],          // comma-separated list of from entities for walk
            toentities: [],            // comma-separated list of to entities for walk
            evalRunDialogOpen: false,  // is eval dialog open
            evalResponse: "",          // eval response value
            runAttributes: {},         // run attributes
            selectedScheduleDataTime: new Date(), // selected data time
            appType: {},               // app type chosen
            openRespDialog: false,     // response dialog for walk, query, etc.
        }

        // extract {appType, group, appId} from props /appView/:appType:group:appId
        var sp = this.props.location.pathname.split(':');
        if (sp.length > 1) {
            this.state.appType = sp[1];
            this.state.groupItemValue = sp[2];
            this.state.appId = sp[3];
        }

        // if any critical info are not defined, throw
        if (this.state.appType === "" || this.state.groupItemValue === "" || this.state.appId === "") {
            throw new Error('appView has no {appType, group, appId} set');
        }

        // eval dialog
        this.evalAppApi = this.evalAppApi.bind(this);
        this.handleEvalButtonClick = this.handleEvalButtonClick.bind(this);
        this.openEvalAppDialog = this.openEvalAppDialog.bind(this);
        this.closeEvalAppDialog = this.closeEvalAppDialog.bind(this);
        this.handleEvalAppDialogClose = this.handleEvalAppDialogClose.bind(this);
        this.setEvalResponse = this.setEvalResponse.bind(this);
        this.handleEvalAppDialogButtonOk = this.handleEvalAppDialogButtonOk.bind(this);
        this.handleEvalAppDialogButtonCancel = this.handleEvalAppDialogButtonCancel.bind(this);

        // middle bar and buttons
        this.getActionButtons = this.getActionButtons.bind(this);
        this.isGraphVisual = this.isGraphVisual.bind(this);

        // response dialog
        this.handleCloseRespDialog = this.handleCloseRespDialog.bind(this);
        this.renderRespDialog = this.renderRespDialog.bind(this);
        this.getMainCanvas = this.getMainCanvas.bind(this);
        this.resetResponses = this.resetResponses.bind(this);
        this.getRespTitle = this.getRespTitle.bind(this);
        this.getResponseString = this.getResponseString.bind(this);
    }

    // open app run dialog modal
    openEvalAppDialog() {
        this.setState({
            appEvalDialogOpen: true,
            selectedScheduleDataTime: new Date(), // update selection data time
        })
    }

    // close eval app dialog modal
    closeEvalAppDialog() {
        this.setState({
            appEvalDialogOpen: false
        });
    }

    handleEvalButtonClick() {
        this.openEvalAppDialog();
    }

    handleCloseRespDialog() {
        this.setState({
            openRespDialog: false,
        });
        this.resetResponses();
    }

    renderRespDialog() {
        return (
            <Dialog
                open={this.state.openRespDialog}
                onClose={this.handleCloseRespDialog}
                fullWidth
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle>{this.getRespTitle()}</DialogTitle>
                <DialogContent dividers={true}>
                    <DialogContentText>
                        {this.getResponseString()}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCloseRespDialog}>Ok</Button>
                </DialogActions>
            </Dialog >
        );
    }

    getRespTitle() {
        const suffix = " Response"
        if (this.state.evalResponse !== "") {
            return "Eval" + suffix;
        }
        return suffix;
    }

    getResponseString() {
        if (this.state.evalResponse !== "") {
            return this.state.evalResponse.status;
        }
        return "no results found";
    }

    // reset all responses
    resetResponses() {
        this.setState({
            evalResponse: "",
        });
    }

    handleEvalAppDialogButtonOk(event) {
        this.handleEvalAppDialogClose();
    }

    handleEvalAppDialogButtonCancel(event) {
        this.closeEvalAppDialog();
    }

    handleEvalAppDialogClose() {
        this.closeEvalAppDialog();
        this.evalAppApi();
    }

    // evalAppApi handles risk evaluation across all apps
    evalAppApi() {
        var date = new Date(this.state.selectedScheduleDataTime);
        var hours = date.getHours(),
            minutes = "0" + date.getMinutes(),
            seconds = "0" + date.getSeconds();
        var timeStr = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        var prom = EvalApp(this.state.groupItemValue, this.state.appId,
            timeStr, this.state.fromentities[0], // TBD from, to has only 1 attribute for now
            this.state.runAttributes);
        prom.then((value) => {
            this.setEvalResponse(value);
        });
    }

    setEvalResponse(value) {
        this.setState({
            evalResponse: value,
            openRespDialog: true,
        });
    }

    // depending on app collection type display: walk, run, query buttons
    getActionButtons() {
        if (this.state.appType === "attackGraph") {
            return <></>;
        }
        return (
            <>
                <Tooltip title="Evaluate Risks" placement="top-start">
                    <PlayCircleFilledWhiteIcon
                        id="demo-customized-button"
                        size="large"
                        sx={{ width: '6%', height: '3%', mt: 2, boxShadow: 1, borderRadius: 2 }}
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        variant="contained"
                        onClick={this.handleEvalButtonClick}
                        style={{ textTransform: 'none' }}
                        color='success'
                    ></PlayCircleFilledWhiteIcon>
                </Tooltip>
            </>
        );
    }

    // is given app type visual
    isGraphVisual(appType) {
        if (appType === "aws") {
            return true;
        }
        return false;
    }

    // getMainCanvas obtains the main center canvas based on appType
    getMainCanvas() {
        // visualize app types
        if (this.isGraphVisual(this.state.appType)) {
            return (
                <VisualizeGraph
                    id="mygraph1"
                    group={this.state.groupItemValue}
                    appId={this.state.appId}
                    appType={this.state.appType}
                    forceLink={true}
                    forceCollide={true}
                    tickDuration={20}
                    chargeStrength={- 50
                    }
                    chargeDistanceMin={100}
                />
            );
        }

        // everything else
        return (
            <Grid container
                spacing={5}
                sx={{
                    flex: 1,
                    height: '95%',
                    width: '125%',
                    "@media(max-width:1199px)": {
                        display: "flex",
                        flexDirection: "column",
                    }
                }}
            >
                <Grid item
                    lg={9}
                    sx={{
                        mt: 2,
                        "@media(max-width:1199px)": {
                            flex: 1,
                            minHeight: "50vh"
                        },
                    }}
                >
                    <AppFlow
                        id="mygraph1"
                        group={this.state.groupItemValue}
                        appId={this.state.appId}
                        appType={this.state.appType}
                    />
                </Grid>
            </Grid>
        );
    }

    // return Apps UX component
    render() {
        return (
            <div className="appView">
                <div className="appViewTopbar">
                    <div className="appViewTitle">
                        <ArrowBackIosNewIcon sx={{ mr: 2, cursor: 'pointer' }}
                            onClick={() => window.history.back()} />
                        {this.state.appId}
                    </div>
                    {this.getActionButtons()}
                </div>

                {this.getMainCanvas()}
                {this.renderRespDialog()}

                <Dialog
                    open={this.state.appEvalDialogOpen}
                    onClose={this.handleEvalAppDialogClose}
                    fullWidth
                >
                    <DialogTitle>Evaluate Attack Path Risks: {this.state.appId}</DialogTitle>
                    <DialogContent>
                        <p /><label>Attributes to evaluate graph: </label>
                        <TextField id="runAttributes"
                            label="Attributes"
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder="e.g. brute-force=true"
                        /><p />

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleEvalAppDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleEvalAppDialogButtonOk}>Evaluate</Button>
                    </DialogActions>
                </Dialog>
            </div >
        )
    }
}
import React, { Component } from "react";
import "./appView.css";
// we may include only one of these, so disable warnings
// eslint-disable-next-line
import VisualizeGraph from '../../components/graph/VisualizeGraph';
// eslint-disable-next-line
import Graph from '../../components/graph/Graph';
import AppFlow from '../../components/graph/AppFlow';
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import AcUnitOutlinedIcon from "@mui/icons-material/AcUnitOutlined";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Tooltip from '@mui/material/Tooltip';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
    EvalApp, JsonLookup,
} from '../../api';
import { GetEntityIcon, IsGenericComponent, IconComponent } from '../../components/graph/AppGraphCommon';

// menu props for select component
const ITEM_HEIGHT = 58;
const ITEM_PADDING_TOP = 10;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

// map a given entity action type to appropriate accordion category
const _accordionActionMap = new Map([
    ['generic', 'Generic'],
    ['expr', 'Expression'],
    ['rest', 'REST'],
]);

// given an entity types, return accordion category type
function GetAccordionType(entityType) {
    var atype = _accordionActionMap.get(entityType.toLowerCase());
    if (atype === undefined) {
        atype = 'generic';
    }
    return atype;
}

// given an array of entity types, return accordion category types
function GetAccordionTypes(entityTypes) {
    var atypes = [];
    for (var i = 0; i < entityTypes.length; i++) {
        atypes.push(GetAccordionType(entityTypes[i]));
    }
    return atypes;
}

// given a list of entities, return a map of accordions
function NewAccordionMap(entityTypes) {
    var amap = new Map();
    var atypes = GetAccordionTypes(entityTypes);
    for (var i = 0; i < atypes.length; i++) {
        var acc = atypes[i];
        if (amap.has(acc)) {
            continue;
        }
        amap.set(acc, {
            id: acc,
            icon: <AcUnitOutlinedIcon />, // TBD
            label: acc,
            content: [],
        });
    }
    return amap;
}

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
            appWalkDialogOpen: false,  // is walk dialog open
            appRunDialogOpen: false,   // is run dialog open
            appExposeApiDialogOpen: false, // is expose API dialog open
            appQueryDialogOpen: false, // is query dialog open
            walkResponse: "",          // walk response string
            walkActionsResponse: "",   // walk action response entity
            runResponse: "",           // run response string
            queryResponse: "",         // query response string
            walkAttributes: {},        // walk attributes
            runAttributes: {},         // run attributes
            selectedScheduleDataTime: new Date(), // selected data time
            runAppResults: {},         // run app results
            appType: {},               // app type chosen
            entityColl: [],            // entity collection for a given appType
            openRespDialog: false,     // response dialog for walk, query, etc.
            openAccessDialog: false,   // access dialog
            showShareResultsDialog: false, // show share results dialog
            accordionItems: [],            // sidebar accordion items for display
            exposeApiId: "",               // expose API Id
            exposeResponses: [],           // expose API responses
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

        // bind internal routines
        this.handleWalkButtonClick = this.handleWalkButtonClick.bind(this);
        this.handleRunButtonClick = this.handleRunButtonClick.bind(this);
        this.handleQueryButtonClick = this.handleQueryButtonClick.bind(this);
        this.fetchAppEntities = this.fetchAppEntities.bind(this);
        this.handleSelectFromEntitiesChange = this.handleSelectFromEntitiesChange.bind(this);
        this.handleSelectToEntitiesChange = this.handleSelectToEntitiesChange.bind(this);

        // walk dialog
        this.setWalkResponse = this.setWalkResponse.bind(this);
        this.setWalkActionResponse = this.setWalkActionResponse.bind(this);
        this.openAppWalkDialog = this.openAppWalkDialog.bind(this);
        this.closeAppWalkDialog = this.closeAppWalkDialog.bind(this);
        this.handleWalkAppDialogClose = this.handleWalkAppDialogClose.bind(this);
        this.handleWalkAppDialogButtonOk = this.handleWalkAppDialogButtonOk.bind(this);
        this.handleWalkAppDialogButtonCancel = this.handleWalkAppDialogButtonCancel.bind(this);

        // run dialog
        this.runAppApi = this.runAppApi.bind(this);
        this.setRunResponse = this.setRunResponse.bind(this);
        this.openAppRunDialog = this.openAppRunDialog.bind(this);
        this.closeAppRunDialog = this.closeAppRunDialog.bind(this);
        this.handleRunAppDialogClose = this.handleRunAppDialogClose.bind(this);
        this.handleRunAppDialogButtonOk = this.handleRunAppDialogButtonOk.bind(this);
        this.handleRunAppDialogButtonCancel = this.handleRunAppDialogButtonCancel.bind(this);
        this.handleRunAppDialogButtonGetResults = this.handleRunAppDialogButtonGetResults.bind(this);

        // expose API dialog
        this.setExposeApiResponse = this.setExposeApiResponse.bind(this);
        this.openAppExposeApiDialog = this.openAppExposeApiDialog.bind(this);
        this.closeAppExposeApiDialog = this.closeAppExposeApiDialog.bind(this);
        this.handleExposeApiButtonClick = this.handleExposeApiButtonClick.bind(this);
        this.handleExposeApiDialogButtonOk = this.handleExposeApiDialogButtonOk.bind(this);
        this.handleExposeApiDialogButtonCancel = this.handleExposeApiDialogButtonCancel.bind(this);

        // query dialog
        this.setQueryResponse = this.setQueryResponse.bind(this);
        this.openAppQueryDialog = this.openAppQueryDialog.bind(this);
        this.closeAppQueryDialog = this.closeAppQueryDialog.bind(this);
        this.handleQueryAppDialogClose = this.handleQueryAppDialogClose.bind(this);
        this.handleQueryAppDialogButtonOk = this.handleQueryAppDialogButtonOk.bind(this);
        this.handleQueryAppDialogButtonCancel = this.handleQueryAppDialogButtonCancel.bind(this);

        // schedule
        this.handleScheduleDateTimeChange = this.handleScheduleDateTimeChange.bind(this);

        // appType and entity collection
        this.setEntityColl = this.setEntityColl.bind(this);
        this.handleEntityItemClick = this.handleEntityItemClick.bind(this);
        this.getEntityIcon = this.getEntityIcon.bind(this);
        this.getActionButtons = this.getActionButtons.bind(this);
        this.getMiddlebarApps = this.getMiddlebarApps.bind(this);
        this.isGraphVisual = this.isGraphVisual.bind(this);

        // response dialog
        this.handleCloseRespDialog = this.handleCloseRespDialog.bind(this);
        this.renderRespDialog = this.renderRespDialog.bind(this);
        this.getMainCanvas = this.getMainCanvas.bind(this);
        this.resetResponses = this.resetResponses.bind(this);
        this.getRespTitle = this.getRespTitle.bind(this);
        this.getResponseString = this.getResponseString.bind(this);

        // draggable component box
        this.handleDragMouseMove = this.handleDragMouseMove.bind(this);
        this.handleDragMouseUp = this.handleDragMouseUp.bind(this);
        this.handleDragMouseDown = this.handleDragMouseDown.bind(this);
        this.setMiddleBarDraggable = this.setMiddleBarDraggable.bind(this);

        this.saveAccordions = this.saveAccordions.bind(this);
    }

    // fetchAppEntities fetches entities corresponding to appId
    fetchAppEntities(appId) {
        return
    }

    // open app walk dialog modal
    openAppWalkDialog() {
        this.setState({
            appWalkDialogOpen: true,
        })
    }

    // close app dialog modal
    closeAppWalkDialog() {
        this.setState({
            appWalkDialogOpen: false
        });
    }

    handleWalkButtonClick() {
        this.fetchAppEntities(this.state.appId);
        this.openAppWalkDialog();
    }

    // open app run dialog modal
    openAppRunDialog() {
        this.setState({
            appRunDialogOpen: true,
            selectedScheduleDataTime: new Date(), // update selection data time
        })
    }

    // close app run dialog modal
    closeAppRunDialog() {
        this.setState({
            appRunDialogOpen: false
        });
    }

    handleRunButtonClick() {
        //this.fetchAppEntities(this.state.appId);
        this.openAppRunDialog();
    }

    // open app expose API dialog modal
    openAppExposeApiDialog() {
        this.setState({
            appExposeApiDialogOpen: true,
        })
    }

    // close app expose API dialog modal
    closeAppExposeApiDialog() {
        this.setState({
            appExposeApiDialogOpen: false
        });
    }

    handleExposeApiButtonClick() {
        this.fetchAppEntities(this.state.appId);
        this.openAppExposeApiDialog();
    }

    handleExposeApiDialogButtonOk(event) {
        this.closeAppExposeApiDialog();

        // API Id
        var input = document.getElementById("exposeApiId");
        if (input == null || input.value === undefined || input.value === "") {
            console.error("error: expose API id is mandatory");
            return;
        }
        // eslint-disable-next-line
        this.state.exposeApiId = input.value;

        // expose responses
        input = document.getElementById("exposeResponses");
        if (input != null && input.value !== undefined && input.value !== "") {
            // eslint-disable-next-line
            this.state.exposeResponses[0] = input.value;
        }
    }

    handleExposeApiDialogButtonCancel(event) {
        this.closeAppExposeApiDialog();
    }

    handleQueryButtonClick() {
        this.openAppQueryDialog();
    }

    // handleSelectFromEntitiesChange handles changes to from entities
    handleSelectFromEntitiesChange(event) {
        const {
            target: { value },
        } = event;
        event.target.id = "fromentities";

        // split into array, only for internal state purposes
        this.setState({
            fromentities: (typeof value === 'string' ? value.split(',') : value)
        })
    }

    // handleSelectToEntitiesChange handles changes to entities
    handleSelectToEntitiesChange(event) {
        const {
            target: { value },
        } = event;
        event.target.id = "toentities";

        // split into array, only for internal state purposes
        this.setState({
            toentities: (typeof value === 'string' ? value.split(',') : value)
        })
    }

    setExposeApiResponse(value) {
        this.setState({
            exposeApiResponse: value,
        });
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
        if (this.state.walkResponse !== "") {
            return "Walk" + suffix;
        } else if (this.state.queryResponse !== "") {
            return "Query" + suffix;
        } else if (this.state.runResponse !== "") {
            return "Run" + suffix;
        }
        return suffix;
    }

    getResponseString() {
        // walk
        if (this.state.walkResponse !== "") {
            var resp = this.state.walkResponse;
            if (resp.path.length > 0) {
                var str = "Walk from [" + this.state.fromentities + "] to [" + this.state.toentities +
                    "] succeeded!";
                if (this.state.walkActionsResponse === "") {
                    return str;
                }
                var jsonResp = JsonLookup(this.state.walkActionsResponse, "responseData");
                if (jsonResp === null) {
                    return str;
                }
                str = str + "Response data for " +
                    this.state.toentities[0] + ": " + jsonResp;
                return str;
            }
            return "Walk failed from [" + this.state.fromentities + "] to [" + this.state.toentities +
                "]";
        }

        // query
        if (this.state.queryResponse !== "") {
            if (this.state.queryResponse.error !== "") {
                return "query returned error: " + JSON.stringify(this.state.queryResponse);
            }
            return JSON.stringify(this.state.queryResponse.response);
        }

        // run
        if (this.state.runResponse !== "") {
            return this.state.runResponse.status;
        }
        return "no results found";
    }

    setWalkResponse(value) {
        this.setState({
            walkResponse: value,
            openRespDialog: true,
        });
    }

    setWalkActionResponse(value) {
        this.setState({
            walkActionsResponse: value,
        });
    }

    // reset all responses
    resetResponses() {
        this.setState({
            walkResponse: "",
            walkActionResponse: "",
            queryResponse: "",
            runResponse: "",
        });
    }

    handleWalkAppDialogButtonOk(event) {
        this.handleWalkAppDialogClose();
    }

    handleWalkAppDialogButtonCancel(event) {
        this.closeAppWalkDialog();
    }

    handleWalkAppDialogClose() {
        this.closeAppWalkDialog();

        var input = document.getElementById("walkAttributes");
        if (input != null && input.value !== undefined && input.value !== "") {
            this.setState({
                walkAttributes: input.value,
            });
        }
    }

    setQueryResponse(value) {
        this.setState({
            queryResponse: value,
            openRespDialog: true,
        })
    }

    // open app query dialog modal
    openAppQueryDialog() {
        this.setState({
            appQueryDialogOpen: true,
        })
    }

    // close app query dialog modal
    closeAppQueryDialog() {
        this.setState({
            appQueryDialogOpen: false
        });
    }

    handleQueryAppDialogClose() {
        this.closeAppQueryDialog();

        var input = document.getElementById("queryStr");
        if (input != null && input.value !== undefined && input.value !== "") {
        }
    }

    handleQueryAppDialogButtonOk(event) {
        this.handleQueryAppDialogClose();
    }

    handleQueryAppDialogButtonCancel(event) {
        this.closeAppQueryDialog();
    }

    handleRunAppDialogButtonOk(event) {
        this.handleRunAppDialogClose();
    }

    handleRunAppDialogButtonCancel(event) {
        this.closeAppRunDialog();
    }

    handleRunAppDialogButtonGetResults(event) {
        this.runAppResultsApi();
    }

    // runAppApi handles run app
    runAppApi() {
        var date = new Date(this.state.selectedScheduleDataTime);
        var hours = date.getHours(),
            minutes = "0" + date.getMinutes(),
            seconds = "0" + date.getSeconds();
        var timeStr = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

        var prom = EvalApp(this.state.groupItemValue, this.state.appId,
            timeStr, this.state.fromentities[0], // TBD from, to has only 1 attribute for now
            this.state.runAttributes);
        prom.then((value) => {
            this.setRunResponse(value);
        });
    }

    // runAppResultsApi obtains run app results from last run
    runAppResultsApi() {
        if (this.state.runResponse.jobid === undefined) {
            return;
        }
    }

    setRunResponse(value) {
        this.setState({
            runResponse: value,
            openRespDialog: true,
        });
    }

    setRunAppResults(value) {
        this.setState({
            runAppResults: value,
            openRespDialog: true,
        });
    }

    handleRunAppDialogClose() {
        this.closeAppRunDialog();

        var input = document.getElementById("runAttributes");
        if (input != null && input.value !== undefined && input.value !== "") {
            this.setState({
                walkAttributes: input.value,
            });
        }
        this.runAppApi();
    }

    handleScheduleDateTimeChange(e) {
        this.setState({
            selectedScheduleDataTime: e,
        });
    }

    // set entity collection for appType
    setEntityColl(entities) {
        this.setState({
            entityColl: entities,
        });
    }

    // given an array of entity collection items, obtain an array of accordionItems
    saveAccordions(entityColl) {
        const entities = entityColl.map(obj => obj.id);
        var accordions = NewAccordionMap(entities);

        // add accordion contents based on entityColl
        for (var i = 0; i < entityColl.length; i++) {
            var ent = entityColl[i];
            var atype = GetAccordionType(ent.id);
            accordions.get(atype).content.push(
                <IconComponent
                    kind={ent.id}
                    onClickFn={this.handleEntityItemClick}
                />
            );
        }

        // return accordions map values as array
        this.setState({
            accordionItems: [...accordions.values()],
        });
    }

    handleEntityItemClick(entityItem) {
    }

    getEntityIcon(entItem) {
        if (entItem === undefined || entItem.id === undefined) {
            return (<></>);
        }
        var icon = GetEntityIcon(entItem.id);
        return (
            // image properties defined in wrapping div class
            <img src={icon} alt={entItem.id}></img>
        );
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
                        onClick={this.handleRunButtonClick}
                        style={{ textTransform: 'none' }}
                        color='success'
                    ></PlayCircleFilledWhiteIcon>
                </Tooltip>
            </>
        );
    }

    getMiddlebarApps() {
        if (IsGenericComponent(this.state.appType)) {
            return <></>;
        }
        return (
            <Box
                sx={{
                    mt: 2,
                    backgroundColor: "white",
                    "@media (min-width:1200px)": {
                        height: "98%",
                    },
                    borderRadius: "16px",
                    boxShadow:
                        "rgb(26 25 43 / 2%) 0px 2.8px 2.2px,rgb(26 25 43 / 2%) 0px 12.5px 10px,rgb(26 25 43 / 2%) 0px 22.3px 17.9px,rgb(26 25 43 / 3%) 0px 41.8px 33.4px,rgb(26 25 43 / 2%) 0px 100px 80px",
                }}
            >
                {this.state.accordionItems.map((item) => (
                    <Accordion
                        key={item.id}
                        sx={{
                            margin: "0 !important",
                            boxShadow: "none",
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`${item.id}bh-content`}
                            id={`${item.id}bh-header`}
                            sx={{
                                color: "#A8B0B9",
                                "& .MuiSvgIcon-root": {
                                    marginRight: 1.5,
                                },
                                "& .Mui-expanded": {
                                    color: "#3A55AD",
                                    "& .MuiTypography-root": {
                                        color: "#3A55AD"
                                    }
                                }
                            }}
                        >
                            {item.icon}
                            <Typography sx={{
                                color: "#4F5B67"
                            }}>{item.label}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 3,
                                }}
                            >
                                {item.content}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        );
    }

    // draggable middlebar
    setMiddleBarDraggable() {
        const dragBar = document.getElementById("appViewMiddlebar");
        document.addEventListener("mousemove", this.handleDragMouseMove);
        document.addEventListener("mouseup", this.handleDragMouseUp);
        if (dragBar !== null) {
            dragBar.addEventListener("mousedown", this.handleDragMouseDown);
        }
    }

    handleDragMouseDown(event) {
        const dragBar = document.getElementById("appViewMiddlebar");
        this.isDragging = true;
        if (dragBar !== null) {
            this.offsetX = event.clientX - dragBar.offsetLeft;
            this.offsetY = event.clientY - dragBar.offsetTop;
        }
    }

    handleDragMouseUp() {
        this.isDragging = false;
    }

    handleDragMouseMove(event) {
        if (!this.isDragging) return;
        const x = event.clientX - this.offsetX;
        const y = event.clientY - this.offsetY;
        this.isDragging = true;
        const dragBar = document.getElementById("appViewMiddlebar");
        if (dragBar !== null) {
            dragBar.style.left = x + "px";
            dragBar.style.top = y + "px";
        }
    }

    // is given app type visual
    isGraphVisual(appType) {
        if (appType === "k8sgraph" || appType === "visualize" || appType === "yucca" || appType === "aws") {
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

    // react component load initial hook
    componentDidMount() {
        this.setMiddleBarDraggable();
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
                    open={this.state.appWalkDialogOpen}
                    onClose={this.handleWalkAppDialogClose}
                    fullWidth
                >
                    <DialogTitle>Walk App - {this.state.appId}</DialogTitle>
                    <DialogContent>

                        <label>From: </label>
                        <Select
                            id={"fromentities"}      // id does not work in onChange
                            labelId={"fromentities"} // id does not work in onChange
                            multiple
                            sx={{ width: 290, maxWidth: 290, height: 40, maxHeight: 40 }}
                            value={this.state.fromentities}
                            input={<OutlinedInput label="Tag" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                            onChange={(event) => this.handleSelectFromEntitiesChange(event)}
                        >
                            {this.state.appEntities.map((name) => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox checked={this.state.fromentities.indexOf(name) > -1} />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            ))}
                        </Select><p />

                        <label>To: </label>
                        <Select
                            id={"toentities"}      // id does not work in onChange
                            labelId={"toentities"} // id does not work in onChange
                            multiple
                            sx={{ width: 290, maxWidth: 290, height: 40, maxHeight: 40 }}
                            value={this.state.toentities}
                            input={<OutlinedInput label="Tag" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                            onChange={(event) => this.handleSelectToEntitiesChange(event)}
                        >
                            {this.state.appEntities.map((entity) => (
                                <MenuItem key={entity} value={entity}>
                                    <Checkbox checked={this.state.toentities.indexOf(entity) > -1} />
                                    <ListItemText primary={entity} />
                                </MenuItem>
                            ))}
                        </Select><p /><br />

                        <TextField id="walkAttributes"
                            label="Walk Attributes"
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder="e.g. passcode=13552"
                        /><p />


                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleWalkAppDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleWalkAppDialogButtonOk}>Walk</Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={this.state.appRunDialogOpen}
                    onClose={this.handleRunAppDialogClose}
                    fullWidth
                >
                    <DialogTitle>Evaluate Risks: {this.state.appId}</DialogTitle>
                    <DialogContent>

                        <p /><label>Schedule: </label>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                                openTo="hours"
                                views={['hours', 'minutes', 'seconds']}
                                inputFormat="HH:mm:ss"
                                mask="__:__:__"
                                label="Run Schedule"
                                value={this.state.selectedScheduleDataTime}
                                onChange={(newValue) => {
                                    this.handleScheduleDateTimeChange(newValue);
                                }}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider><p />

                        <TextField id="runAttributes"
                            label="Attributes"
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder="e.g. passcode=13552"
                        /><p />

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleRunAppDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleRunAppDialogButtonOk}>Evaluate</Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={this.state.appExposeApiDialogOpen}
                    onClose={this.handleExposeApiButtonClick}
                    fullWidth
                >
                    <DialogTitle>Expose API - {this.state.appId}</DialogTitle>
                    <DialogContent>
                        <TextField
                            id="exposeApiId"
                            label="API Id"
                            type="text"
                            fullWidth
                            variant="standard"
                            required
                        /><p />

                        <label>From </label>
                        <Select
                            id={"fromentities"}      // id does not work in onChange
                            labelId={"fromentities"} // id does not work in onChange
                            sx={{ width: 290, maxWidth: 290, height: 40, maxHeight: 40 }}
                            value={this.state.fromentities}
                            input={<OutlinedInput label="Tag" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                            onChange={(event) => this.handleSelectFromEntitiesChange(event)}
                        >
                            {this.state.appEntities.map((name) => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox checked={this.state.fromentities.indexOf(name) > -1} />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            ))}
                        </Select><p />

                        <label>To </label>
                        <Select
                            id={"toentities"}      // id does not work in onChange
                            labelId={"toentities"} // id does not work in onChange
                            sx={{ width: 290, maxWidth: 290, height: 40, maxHeight: 40 }}
                            value={this.state.toentities}
                            input={<OutlinedInput label="Tag" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={MenuProps}
                            onChange={(event) => this.handleSelectToEntitiesChange(event)}
                        >
                            {this.state.appEntities.map((entity) => (
                                <MenuItem key={entity} value={entity}>
                                    <Checkbox checked={this.state.toentities.indexOf(entity) > -1} />
                                    <ListItemText primary={entity} />
                                </MenuItem>
                            ))}
                        </Select><p /><br />

                        <TextField
                            id="exposeResponses"
                            label="Responses"
                            type="text"
                            fullWidth
                            variant="standard"
                        /><p />

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleExposeApiDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleExposeApiDialogButtonOk}>Expose API</Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={this.state.appQueryDialogOpen}
                    onClose={this.handleQueryAppDialogClose}
                    fullWidth
                >
                    <DialogTitle>Query App - {this.state.appId}</DialogTitle>
                    <DialogContent>

                        <TextField id="queryStr"
                            label="Query String"
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder="e.g. MATCH (u: user) RETURN u.Id;"
                        /><p />

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleQueryAppDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleQueryAppDialogButtonOk}>Query</Button>
                    </DialogActions>
                </Dialog>
            </div >
        )
    }
}

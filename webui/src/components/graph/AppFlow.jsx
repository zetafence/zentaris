import GraphBase from "./GraphBase";
import React, { useCallback } from 'react';
import ReactFlow, {
    useNodesState, useEdgesState,
    getIncomers, getOutgoers, getConnectedEdges,
    addEdge, Background, Controls, Handle, Position
} from 'reactflow';
import dagre from 'dagre';
import { initialActions, MAX_ACTIONS } from "./GraphBase";
import { Subject } from 'rxjs';
import Paper from "@mui/material/Paper";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { GetAppComponent, IsGenericComponent } from './AppGraphCommon';
import { NO_ACTION_TYPE } from "./GraphBase";
import { HYPEREDGE_KEY_DELIMITER } from './GraphBase';

import 'reactflow/dist/style.css';
import "./appflow.css";

const bgColor = "#D5E4E2";
const defaultViewport = { x: 0, y: 0, zoom: 7.5 };
const snapGrid = [20, 20];
const linkStrokeColor = "#3498DB";
const connectionLineStyle = {
    stroke: linkStrokeColor,
};

// node types
const nodeTypes = {
    custom: CustomNode,
}

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

// CustomNode with id and type
// inputs: id, type, source, target
function CustomNode({ id, data }) {
    const kind = data.kind;
    const isSource = data.isSource;
    const isTarget = data.isTarget;

    function getSource() {
        if (isSource === true) {
            return (
                <Handle
                    type="source"
                    style={{ background: "#555" }}
                    id="b"
                    position={Position.Bottom}
                />
            );
        }
        return <></>;
    }

    function getTarget() {
        if (isTarget === true) {
            return (
                <Handle
                    type="target"
                    style={{ background: "#555" }}
                    id="b"
                    position={Position.Top}
                />
            );
        }
        return <></>;
    }

    return (
        <>
            <div className="custom-node">
                <div style={{ fontSize: '6px', fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}>
                    <label>{id}</label>
                    <img alt="" class={"custom-node-icon " + kind} />
                </div>
            </div>
            {getSource()}
            {getTarget()}
        </>
    );
}

const nodeWidth = 80;
const nodeHeight = 10;

// Helper function for layout positioning using dagre
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    //dagreGraph.setGraph({ rankdir: direction });
    dagreGraph.setGraph({ rankdir: direction, align: 'UL' }); // UL alignment for wrapping

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
        return node;
    });

    return { nodes: layoutedNodes, edges };
};

// CustomNodeFlow customizes React Flow workflow
const CustomNodeFlow = (props) => {
    // update initial node positions
    const { nodes: inodes, edges: ilinks } = getLayoutedElements(props.nodes, props.links);

    const [nodes, , onNodesChange] = useNodesState(inodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(ilinks);

    // handler functions from props
    const onNodesChangeHandlerFn = props.onNodesChangeHandlerFn;
    const onEdgesChangeHandlerFn = props.onEdgesChangeHandlerFn;
    const onConnectHandlerFn = props.onConnectHandlerFn;
    const onNodesDeleteHandlerFn = props.onNodesDeleteHandlerFn;
    const onNodeDragStopHandlerFn = props.onNodeDragStopHandlerFn;
    const onEdgesDeleteHandlerFn = props.onEdgesDeleteHandlerFn;

    function onNodesChangeFn(changedNodes) {
        var result = (onNodesChangeHandlerFn === undefined);
        if (result === false) {
            result = onNodesChangeHandlerFn(nodes);
        }
        if (result === true) {
            onNodesChange(changedNodes);
        }
    }

    function onEdgesChangeFn(edges) {
        var result = (onEdgesChangeHandlerFn === undefined);
        if (result === false) {
            result = onEdgesChangeHandlerFn(edges);
        }
        if (result === true) {
            onEdgesChange(edges);
        }
    }

    const onConnect = useCallback(
        (params) =>
            // eslint-disable-next-line
            setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: linkStrokeColor } }, eds)), []
    );

    function onConnectFn(params) {
        var result = (onConnectHandlerFn === undefined);
        if (result === false) {
            result = onConnectHandlerFn(params);
        }
        if (result === true) {
            onConnect(params);
        }
    }

    const onNodesDeleteHandler = useCallback(
        (deleted) => {
            setEdges(
                deleted.reduce((acc, node) => {
                    const incomers = getIncomers(node, nodes, edges);
                    const outgoers = getOutgoers(node, nodes, edges);
                    const connectedEdges = getConnectedEdges([node], edges);

                    const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge));

                    const createdEdges = incomers.flatMap(({ id: source }) =>
                        outgoers.map(({ id: target }) => ({
                            id: `${source}->${target}`,
                            source, target,
                            animated: true,
                            style: { stroke: linkStrokeColor },
                        }))
                    );

                    return [...remainingEdges, ...createdEdges];
                }, edges)
            );
        },
        // eslint-disable-next-line
        [nodes, edges]
    );

    function onNodesDeleteHandlerFunc(nodes) {
        var result = (onNodesDeleteHandlerFn === undefined);
        if (result === false) {
            result = onNodesDeleteHandlerFn(nodes);
        }
        if (result === true) {
            onNodesDeleteHandler(nodes);
        }
    }

    function onEdgesDeleteHandlerFunc(edges) {
        var result = (onEdgesDeleteHandlerFn === undefined);
        if (result === false) {
            result = onEdgesDeleteHandlerFn(edges);
        }
    }

    const onNodeDragStop = (event, node) => {
        if (onNodeDragStopHandlerFn !== undefined) {
            onNodeDragStopHandlerFn(node);
        }
    }

    const proOptions = { hideAttribution: true };

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeFn}
            onEdgesChange={onEdgesChangeFn}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnectFn}
            onNodesDelete={(nodes) => onNodesDeleteHandlerFunc(nodes)}
            onEdgesDelete={(edges) => onEdgesDeleteHandlerFunc(edges)}
            style={{ background: bgColor }}
            nodeTypes={nodeTypes}
            connectionLineStyle={connectionLineStyle}
            snapGrid={snapGrid}
            defaultViewport={defaultViewport}
            fitView
            proOptions={proOptions}
        >
            <Background gap={10} size={1} />
            <Controls />
        </ReactFlow>
    );
}

// subject for async graph communication between react components
export const AsyncGraphSubscriptionAppFlow = new Subject();

// AppFlow implements workflow using graph semantics
export default class AppFlow extends GraphBase {
    constructor(props) {
        super(props);

        this.setFlowNodes = this.setFlowNodes.bind(this);
        this.setWorkflow = this.setWorkflow.bind(this);
        super.setFetchComplete(this.setWorkflow);
        super.setDeleteNodeComplete(this.setWorkflow);

        this.setFlowLinks = this.setFlowLinks.bind(this);
        super.setCreateLinkComplete(this.setWorkflow);
        super.setDeleteLinkComplete(this.setWorkflow);

        // local state info
        this.selectedHyperedge = null;
        this.selectedLink = null;

        // local bind routines
        this.showNodeDialogActionsButton = this.showNodeDialogActionsButton.bind(this);
        this.renderNodeDialog = this.renderNodeDialog.bind(this);

        // node actions
        this.findNode = this.findNode.bind(this);
        this.unmarshalEntityActions = this.unmarshalEntityActions.bind(this);
        this.handleNodeActionsDialogButton = this.handleNodeActionsDialogButton.bind(this);
        this.closeNodeActionsDialogButton = this.closeNodeActionsDialogButton.bind(this);
        this.handleNodeActionsDialogButtonOk = this.handleNodeActionsDialogButtonOk.bind(this);
        this.handleNodeActionsDialogButtonCancel = this.handleNodeActionsDialogButtonCancel.bind(this);
        this.deleteAllActions = this.deleteAllActions.bind(this);

        this.updateActionsCallbackFn = this.updateActionsCallbackFn.bind(this);
        this.deleteAllActionsCallbackFn = this.deleteAllActionsCallbackFn.bind(this);
        this.renderNodeActionsDialog = this.renderNodeActionsDialog.bind(this);

        // hyperedge
        this.addHyperedge = this.addHyperedge.bind(this);
        this.openHyperedgeDialog = this.openHyperedgeDialog.bind(this);
        this.renderHyperedgeDialog = this.renderHyperedgeDialog.bind(this);
        this.renderHyperedgeActionsDialog = this.renderHyperedgeActionsDialog.bind(this);
        this.handleExprTypeSelectChange = this.handleExprTypeSelectChange.bind(this);
        this.handleVertexSelectChange = this.handleVertexSelectChange.bind(this);
        this.handleVertexParamsSelectChange = this.handleVertexParamsSelectChange.bind(this);
        this.handleVertexOpSelectChange = this.handleVertexOpSelectChange.bind(this);
        this.handleVertexParamValueChange = this.handleVertexParamValueChange.bind(this);
        this.handleTimeParamValueChange = this.handleTimeParamValueChange.bind(this);
        this.handleExprChange = this.handleExprChange.bind(this);
        this.handleOperChange = this.handleOperChange.bind(this);
        this.closeHyperedgeDialog = this.closeHyperedgeDialog.bind(this);
        this.handleHyperedgeActionsDialogButtonOk = this.handleHyperedgeActionsDialogButtonOk.bind(this);
        this.deleteHyperedge = this.deleteHyperedge.bind(this);
        this.handleHyperedgeDialogButtonOk = this.handleHyperedgeDialogButtonOk.bind(this);
        this.handleHyperedgeDialogButtonCancel = this.handleHyperedgeDialogButtonCancel.bind(this);
        this.openHyperedgeDialogActionsButton = this.openHyperedgeDialogActionsButton.bind(this);
        this.closeHyperedgeDialogActionsButton = this.closeHyperedgeDialogActionsButton.bind(this);

        // hyperdge action expr handlers
        this.addNewEdgeActionsForm = this.addNewEdgeActionsForm.bind(this);
        this.delEdgeActionsForm = this.delEdgeActionsForm.bind(this);
        this.deleteAllEdgeActions = this.deleteAllEdgeActions.bind(this);

        // handlers
        this.onNodesChangeHandlerFn = this.onNodesChangeHandlerFn.bind(this);
        this.onEdgesChangeHandlerFn = this.onEdgesChangeHandlerFn.bind(this);
        this.onConnectHandlerFn = this.onConnectHandlerFn.bind(this);
        this.onNodesDeleteHandlerFn = this.onNodesDeleteHandlerFn.bind(this);
        this.onEdgesDeleteHandlerFn = this.onEdgesDeleteHandlerFn.bind(this);
        this.onNodeDragStopHandlerFn = this.onNodeDragStopHandlerFn.bind(this);

        // async message subscription for adding entities
        this.subscribeAddNewEntity = this.subscribeAddNewEntity.bind(this);
        this.unSubscribeAddNewEntity = this.unSubscribeAddNewEntity.bind(this);

        // set empty nodes
        this.snodes = [];
        this.slinks = [];
    }

    // async message subscription for adding specific entities
    subscribeAddNewEntity() {
        this.subscription = AsyncGraphSubscriptionAppFlow.subscribe(entityType => {
            super.onClickGraph(entityType);
        });
    }

    unSubscribeAddNewEntity() {
        this.subscription.unsubscribe();
    }

    // setWorkflow sets the overall workflow elements in the graph
    setWorkflow() {
        this.setFlowNodes();
    }

    // setFlowNodes obtains flow specific nodes from given list, and sets them local
    setFlowNodes() {
        var nodes = this.state.data.nodes;
        this.snodes = [];
        for (var idx = 0; idx < nodes.length; idx++) {
            let n = nodes[idx];
            let xx = Math.random() * 100, yy = Math.random() * 100;
            if (n.attributes !== undefined) {
                if (n.attributes.xx !== undefined) {
                    xx = parseInt(n.attributes.xx);
                }
                if (n.attributes.yy !== undefined) {
                    yy = parseInt(n.attributes.yy);
                }
            }
            this.snodes.push({
                id: n.id,
                type: "custom",
                data: {
                    label: n.id,
                    isSource: true,
                    isTarget: true,
                    kind: n.kind,
                },
                position: {
                    x: xx,
                    y: yy
                },
                draggable: true,
                selectable: true,
                connectable: true,
                //onChange: onChange,
                sourcePosition: 'right',
                targetPosition: 'left',
            });
        }

        this.setFlowLinks();

        // update if nodes changed
        if (this.snodes.length > 0) {
            this.forceUpdate();
        }
    }

    // setFlowLinks obtains flow specific links from given list, and sets them local
    setFlowLinks() {
        var links = this.state.data.links;
        this.slinks = [];
        for (var idx = 0; idx < links.length; idx++) {
            let n = links[idx];
            this.slinks.push({
                id: n.id,
                source: n.source[0],
                target: n.target[0],
                animated: true,
                sourceHandle: n.source[0],
                style: { stroke: linkStrokeColor, strokeWidth: 3 },
            });
        }
    }

    componentDidMount() {
        // async subscribe to add specific entities
        this.subscribeAddNewEntity();
    }

    componentWillUnmount() {
        // async unsubscribe adding specific entities
        this.unSubscribeAddNewEntity();
    }

    handleNodeActionsDialogButton() {
        this.handleNodeDialogButtonOk();
        this.setState({
            actionsDialogOpen: true,
        });

        // fetch entity's actions to display
        this.fetchEntityActions(this.getSelectedNodeId(), this.unmarshalEntityActions);
    }

    closeNodeActionsDialogButton() {
        this.setState({
            actionsDialogOpen: false,
        });
    }

    // generic node actions dialog handler
    handleNodeActionsDialogButtonOk(appActions) {
        this.closeNodeActionsDialogButton();

        // check if any actions created so far
        if (appActions.length > 0 &&
            appActions[0].type === NO_ACTION_TYPE) {
            return;
        }

        // massage this.state.appActions[] into generic base this.state.actions[] for API call
        var actionsApi = this.state.actions;
        this.state.actions.length = 0;
        for (let i = 0; i < appActions.length; i++) {
            let action = appActions[i];
            actionsApi[i] = {
                id: action.id,
                name: action.name,
                type: action.type,
                runxtimes: action.runxtimes,
                retryxtimes: action.retryxtimes,
                timeout: action.timeout,
            }
            // remove common fields to retain action type-specific fields
            delete action.id;
            delete action.name;
            delete action.type;
            delete action.runxtimes;
            delete action.retryxtimes;
            delete action.timeout;

            actionsApi[i].data = JSON.stringify(action);
        }

        // create entity actions via API
        super.createEntityActions();

        // clear states
        // TBD setState() results in async error
        // eslint-disable-next-line
        this.state.actions = [];
    }

    handleNodeActionsDialogButtonCancel() {
        this.closeNodeActionsDialogButton();

        // clear states
        // TBD setState() results in async error
        // eslint-disable-next-line
        this.state.appActions = [];
        this.state.actions = [];
    }

    deleteAllActions() {
        if (this.state.selectedNode === null) {
            return;
        }
        super.deleteEntityActions(this.getSelectedNodeId());
        super.resetNodeActions();
    }

    // unmarshalEntityActions unmarshals generic actions[].data into this.state.appActions[] obj map
    unmarshalEntityActions(actions) {
        // this.action[] is a temporary incarnation of generic argument actions[]
        // each action in this.action[] is a distinct action object whose fields are
        // based on action type. For instance, "expr" will have {"expr": "1 > 0"},
        // and "rest" may have {"url": "example.com", "method": "GET"}, etc.
        var retActions = this.state.appActions;
        this.state.appActions.length = 0;
        for (var act of actions) {
            var action = {
                id: act.id,
                name: act.name,
                type: act.type,
                runxtimes: act.runxtimes,
                retryxtimes: act.retryxtimes,
                timeout: act.timeout,
            };
            if (act.data !== undefined && act.data !== null) {
                for (const [key, value] of Object.entries(JSON.parse(act.data))) {
                    action[key] = value;
                }
            }
            retActions.push(action);
        }
    }

    // updateActionsCallbackFn receives updated app-specific actions
    updateActionsCallbackFn(appActions) {
        this.closeNodeActionsDialogButton();
        this.handleNodeActionsDialogButtonOk(appActions);
    }

    // deleteAllActionsCallbackFn deletes all app-specific actions
    deleteAllActionsCallbackFn() {
        this.closeNodeActionsDialogButton();
        this.deleteAllActions();
    }

    showNodeDialogActionsButton() {
        if (IsGenericComponent(this.state.appType)) {
            return <></>;
        }
        return (
            <Button sx={{ mr: 45 }} onClick={this.handleNodeActionsDialogButton}>Actions</Button>
        );
    }

    onNodesChangeHandlerFn(node) {
        return true;
    }

    onEdgesChangeHandlerFn(edge) {
        return true;
    }

    // open hyperedge dialog modal
    openHyperedgeDialog() {
        this.setState({
            hyperedgeDialogOpen: true,
        });
    }

    // hyperedge dialog operations
    handleHyperedgeDialogButtonOk() {
        this.closeHyperedgeDialog();

        if (this.selectedHyperedge === null) {
            return;
        }
        var assoc = this.selectedHyperedge;

        var input = document.getElementById("hedgeId");
        input = document.getElementById("assocName");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.name = input.value;
        }

        input = document.getElementById("hedgeLabel");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.label = input.value;
        }

        input = document.getElementById("hedgeDesc");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.description = input.value;
        }

        input = document.getElementById("hedgeAttr");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.attributes = this.getAttrCsvToObj(input.value);
        }

        // assoc.expressions assumed from this.selectedHyperedge

        super.updateAssocInfo(assoc);
    }

    // cancel hyperedge dialog modal
    handleHyperedgeDialogButtonCancel() {
        this.closeHyperedgeDialog();
    }

    // handle hyperedge dialog actions
    openHyperedgeDialogActionsButton() {
        this.setState({
            hyperedgeDialogOpen: false,
            hyperedgeDialogActionsOpen: true,
        });
    }

    closeHyperedgeDialogActionsButton() {
        this.setState({
            hyperedgeDialogActionsOpen: false,
            hyperedgeDialogOpen: true,
        });
    }

    handleHyperedgeActionsDialogButtonOk() {
        this.closeHyperedgeDialogActionsButton();

        var exprArr = [],
            operArr = [],
            exprs = this.state.appActions;
        for (let i = 0; i < exprs.length; i++) {
            switch (exprs[i].expr_type) {
                case "Expr":
                    exprArr.push(exprs[i].expr);
                    break;
                case "Time Before":
                    // build time value
                    var tstr = "[$time.now] < " + exprs[i].time_param_val;
                    exprArr.push(tstr);
                    break;
                case "Time After":
                    tstr = "[$time.now] > " + exprs[i].time_param_val;
                    exprArr.push(tstr);
                    break;
                case "Vertex":
                    // form vertex expressions
                    var vstr = "[$" + exprs[i].vertex + "." +
                        exprs[i].vertex_param + "]";
                    switch (exprs[i].vertex_op) {
                        case "matches":
                            vstr += " =~ ";
                            break;
                        case "no-match":
                            vstr += " !~ ";
                            break;
                        case "equal":
                            vstr += " == ";
                            break;
                        case "not-equal":
                            vstr += " != ";
                            break;
                        case "greater":
                            vstr += " > ";
                            break;
                        case "lesser":
                            vstr += " < ";
                            break;
                        default:
                            break;
                    }
                    if (exprs[i].vertex_param_val === undefined || exprs[i].vertex_param_val === '') {
                        vstr += '\'\'';
                    } else {
                        vstr += '\'' + exprs[i].vertex_param_val + '\'';
                    }
                    exprArr.push(vstr);
                    break;
                default:
                    break;
            }
            if (i < (exprs.length - 1)) {
                operArr.push(exprs[i].oper);
            }
        }

        // set selected edge expressions
        this.selectedHyperedge.expressions = {
            exprs: exprArr,
            ops: operArr,
            result: "true",    // expected result TBD
            resultType: "bool" // expected type TBD
        };
    }

    handleExprTypeSelectChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "exprType";

        var actions = this.state.appActions;
        actions[index].expr_type = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    handleVertexSelectChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "vertex";

        var actions = this.state.appActions;
        actions[index].vertex = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    handleVertexParamsSelectChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "vertexParam";

        var actions = this.state.appActions;
        actions[index].vertex_param = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    handleVertexOpSelectChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "vertexOp";

        var actions = this.state.appActions;
        actions[index].vertex_op = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    handleVertexParamValueChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "vertexParamVal";

        var actions = this.state.appActions;
        actions[index].vertex_param_val = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    handleTimeParamValueChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "timeParamVal";

        var actions = this.state.appActions;
        actions[index].time_param_val = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    handleExprChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "expr";

        var actions = this.state.appActions;
        actions[index].expr = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    handleOperChange(event, index) {
        const {
            target: { value },
        } = event;
        event.target.id = "operType";

        var actions = this.state.appActions;
        actions[index].oper = (typeof value === 'string' ? value : "");
        this.setState({
            appActions: actions,
        });
    }

    // addNewEdgeActionsForm adds a new entity actions dialog form
    addNewEdgeActionsForm() {
        var len = this.state.appActions.length;
        if (len >= MAX_ACTIONS) {
            var msg = `Only ${MAX_ACTIONS} action expressions allowed per edge!`;
            console.warn(msg);
            alert(msg);
            return;
        }

        let newForm = { ...initialActions };
        newForm.id = "action" + String(len);
        newForm.name = newForm.id;

        this.setState(prevState => {
            return {
                ...prevState,
                appActions: [...prevState.appActions, newForm]
            }
        });
    }

    // delete edge action form deletes form actions
    delEdgeActionsForm(id) {
        let { appActions } = this.state;
        appActions = this.state.appActions.filter(form => form.id !== id);
        this.setState({
            appActions
        });
    }

    deleteAllEdgeActions() {
        this.setState({
            appActions: [],
        });
    }

    // dialog modals for a rendering hyperedge action expressions dialog
    renderHyperedgeActionsDialog() {
        var exprTypeSelect = [
            "Expr",
            "Time Before",
            "Time After",
            "Vertex",
        ],
            vertexParams = [
                "id",
                "name",
                "kind",
                "fitness",
                "actions.status_code",
            ],
            vertexOps = [
                "matches",
                "no-match",
                "equal",
                "not-equal",
                "greater",
                "lesser",
            ],
            operTypeSelect = [
                "&&",
                "||",
            ];
        const vertices = this.snodes.map(obj => obj.id);
        return (
            <Dialog
                open={this.state.hyperedgeDialogActionsOpen}
                onClose={this.closeHyperedgeDialogActionsButton}
                fullWidth
            >
                <DialogTitle>Action Expressions</DialogTitle>
                <DialogContent dividers={true}>
                    <table className="table table-hover" id="tables">
                        <tbody>
                            {this.state.appActions.map((form, index) => (
                                <tr key={form.id}>
                                    <td>
                                        <InputLabel id="expType">Expression Type</InputLabel>
                                        <Select
                                            labelId="exprType"        // id does not work in onChange
                                            label="Expr Type"
                                            sx={{ height: 40, width: 120 }}
                                            value={this.state.appActions[index].expr_type || ''}
                                            renderValue={(selected) => selected}
                                            MenuProps={MenuProps}
                                            onChange={(event) => this.handleExprTypeSelectChange(event, index)}
                                        >
                                            {exprTypeSelect.map((name) => (
                                                <MenuItem key={name} value={name}>
                                                    <Checkbox checked={this.state.appActions[index].expr_type === name} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </td>

                                    <td>
                                        <TextField
                                            style={{ display: (this.state.appActions[index].expr_type === "Expr") || "none" }}
                                            id="expr"
                                            label="expr"
                                            type="text"
                                            sx={{ ml: 1, mr: 1, width: 150 }}
                                            variant="standard"
                                            placeholder="e.g. 12 > 7"
                                            onChange={(event) => this.handleExprChange(event, index)}
                                        />
                                    </td>

                                    <td>
                                        <Select
                                            style={{ display: (this.state.appActions[index].expr_type === "Vertex") || "none" }}
                                            labelId="vertex"        // id does not work in onChange
                                            label="Vertex"
                                            sx={{ height: 40, width: 120 }}
                                            value={this.state.appActions[index].vertex || ''}
                                            renderValue={(selected) => selected}
                                            MenuProps={MenuProps}
                                            onChange={(event) => this.handleVertexSelectChange(event, index)}
                                        >
                                            {vertices.map((name) => (
                                                <MenuItem key={name} value={name}>
                                                    <Checkbox checked={this.state.appActions[index].vertex === name} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </td>

                                    <td>
                                        <Select
                                            style={{ display: (this.state.appActions[index].expr_type === "Vertex") || "none" }}
                                            labelId="vertexParam"        // id does not work in onChange
                                            label="Vertex Field"
                                            sx={{ height: 40, width: 120 }}
                                            value={this.state.appActions[index].vertex_param || ''}
                                            renderValue={(selected) => selected}
                                            MenuProps={MenuProps}
                                            onChange={(event) => this.handleVertexParamsSelectChange(event, index)}
                                        >
                                            {vertexParams.map((name) => (
                                                <MenuItem key={name} value={name}>
                                                    <Checkbox checked={this.state.appActions[index].vertex_param === name} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </td>

                                    <td>
                                        <Select
                                            style={{ display: (this.state.appActions[index].expr_type === "Vertex") || "none" }}
                                            labelId="vertexOp"        // id does not work in onChange
                                            label="Vertex Oper"
                                            sx={{ height: 40, width: 120 }}
                                            value={this.state.appActions[index].vertex_op || ''}
                                            renderValue={(selected) => selected}
                                            MenuProps={MenuProps}
                                            onChange={(event) => this.handleVertexOpSelectChange(event, index)}
                                        >
                                            {vertexOps.map((name) => (
                                                <MenuItem key={name} value={name}>
                                                    <Checkbox checked={this.state.appActions[index].vertex_op === name} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </td>

                                    <td>
                                        <TextField
                                            style={{ display: (this.state.appActions[index].expr_type === "Vertex") || "none" }}
                                            id="vertexParamVal"
                                            label="Vertex Param Value"
                                            type="text"
                                            sx={{ ml: 1, mr: 1, width: 150 }}
                                            variant="standard"
                                            placeholder="e.g. 12 > 7"
                                            onChange={(event) => this.handleVertexParamValueChange(event, index)}
                                        />
                                    </td>

                                    <td>
                                        <TextField
                                            style={{
                                                display: (this.state.appActions[index].expr_type !== undefined &&
                                                    this.state.appActions[index].expr_type.startsWith("Time ")) || "none"
                                            }}
                                            id="timeParamVal"
                                            label="Time Value"
                                            type="text"
                                            sx={{ ml: 1, mr: 1, width: 150 }}
                                            variant="standard"
                                            placeholder="e.g. 08:10:15"
                                            onChange={(event) => this.handleTimeParamValueChange(event, index)}
                                        />
                                    </td>

                                    <td>
                                        <InputLabel id="exprType">Operator</InputLabel>
                                        <Select
                                            labelId="operType"        // id does not work in onChange
                                            label="Oper Type"
                                            sx={{ mr: 2, height: 40, width: 75 }}
                                            value={this.state.appActions[index].oper || ''}
                                            renderValue={(selected) => selected}
                                            MenuProps={MenuProps}
                                            onChange={(event) => this.handleOperChange(event, index)}
                                        >
                                            {operTypeSelect.map((name) => (
                                                <MenuItem key={name} value={name}>
                                                    <Checkbox checked={this.state.appActions[index].oper === name} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </td>

                                    <td><Button
                                        type="submit"
                                        variant="contained"
                                        size="small"
                                        color="warning"
                                        sx={{ mt: 2 }}
                                        style={{ textTransform: 'none' }}
                                        onClick={() => this.delEdgeActionsForm(form.id)}
                                    >
                                        Delete
                                    </Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DialogContent>
                <DialogActions>
                    <DeleteSweepIcon
                        color="error"
                        sx={{ width: 50, height: 50, mr: 35 }}
                        onClick={this.deleteAllEdgeActions}
                    />
                    <AddCircleIcon
                        color="primary"
                        sx={{ width: 50, height: 50, mr: 3 }}
                        onClick={this.addNewEdgeActionsForm}
                    />
                    <Button onClick={this.closeHyperedgeDialogActionsButton}>Cancel</Button>
                    <Button onClick={this.handleHyperedgeActionsDialogButtonOk}>Apply</Button>
                </DialogActions>
            </Dialog>
        );
    }

    // dialog modals for a new hyperedge
    renderHyperedgeDialog() {
        return (<>
            <Dialog
                open={this.state.hyperedgeDialogOpen}
                onClose={this.handleHyperedgeDialogClose}
                fullWidth
            >
                <DialogTitle>
                    Hyperedge {this.selectedHyperedge === null ? "" : this.selectedHyperedge.id}
                </DialogTitle>
                <DialogContent>
                    <TextField id="hedgeId"
                        autoFocus
                        label={`Id ${this.selectedHyperedge === null ? "" : this.selectedHyperedge.id}`}
                        type="text"
                        fullWidth
                        variant="standard"
                        disabled={true}
                        placeholder={`e.g. ${this.selectedHyperedge === null ? "edge-4293" : this.selectedHyperedge.id}`}
                    /><p />

                    <TextField id="hedgeName"
                        label={this.selectedHyperedge === null || this.selectedHyperedge.name === undefined || this.selectedHyperedge.name === "" ? "Hyperedge Name" : `Hyperedge Name (${this.selectedHyperedge.name})`}
                        type="text"
                        fullWidth
                        variant="standard"
                        placeholder={this.selectedHyperedge === null || this.selectedHyperedge.name === undefined || this.selectedHyperedge.name === "" ? `e.g. hyperedge name` : `e.g. ${this.selectedHyperedge.name}`}
                    /><p />

                    <TextField id="hedgeLabel"
                        label={this.selectedHyperedge === null || this.selectedHyperedge.label === undefined || this.selectedHyperedge.label === "" ? "Hyperedge Label" : `Hyperedge Label (${this.selectedHyperedge.label})`}
                        type="text"
                        fullWidth
                        variant="standard"
                        placeholder={this.selectedHyperedge === null || this.selectedHyperedge.label === undefined || this.selectedHyperedge.label === "" ? "e.g. label" : `e.g. ${this.selectedHyperedge.label}`}
                    /><p />

                    <TextField id="hedgeDesc"
                        label={this.selectedHyperedge === null || this.selectedHyperedge.description === undefined || this.selectedHyperedge.description === "" ? "Hyperedge Description" : `Hyperedge Description (${this.selectedHyperedge.description})`}
                        type="text"
                        fullWidth
                        variant="standard"
                        placeholder={this.selectedHyperedge === null || this.selectedHyperedge.description === undefined || this.selectedHyperedge.description === "" ? "description" : `e.g. ${this.selectedHyperedge.description}`}
                    /><p />

                    <TextField id="hedgeAttr"
                        label="Hyperedge Attributes"
                        type="text"
                        fullWidth
                        variant="standard"
                        placeholder="e.g. passcode=46120"
                    /><p />
                </DialogContent>

                <DialogActions>
                    <Button sx={{ mr: 45 }} onClick={this.openHyperedgeDialogActionsButton}>Actions</Button    >
                    <Button onClick={this.handleHyperedgeDialogButtonCancel}>Cancel</Button>
                    <Button onClick={this.handleHyperedgeDialogButtonOk}>Ok</Button>
                </DialogActions>
            </Dialog>
            {this.renderHyperedgeActionsDialog()}
        </>
        );
    }

    // close hyperedge dialog modal
    closeHyperedgeDialog() {
        this.setState({
            hyperedgeDialogOpen: false,
            hyperedgeDialogActionsOpen: false,
        });
    }

    // addHyperedge adds a new hyperedge between vertices
    // input {source, target, others}, all ids array
    addHyperedge(edgeKey, source, target, other, isDialogOpen) {
        // add hyperlink to backend
        var isLinkAdded = super.addLink({
            id: edgeKey,
            source: source,  // empty to start with, when direct assoc created, move
            target: target,  // empty to start with, when direct assoc created, move
            other: other,    // add new vertices to other
            created: true,
        });

        if (!isLinkAdded) {
            return;
        }

        // open hyperedge dialog box for additional inputs
        this.selectedHyperedge = super.getAssocDetails(edgeKey);

        if (isDialogOpen) {
            this.openHyperedgeDialog();
        }
    }

    onConnectHandlerFn(params) {
        const others = [params.source, params.target];
        const edgeKey = others.join(HYPEREDGE_KEY_DELIMITER);
        this.addHyperedge(edgeKey, [params.source], [params.target], [], true);
        return true;
    }

    findNode(nid) {
        var node = null;
        for (var idx = 0; idx < this.state.data.nodes.length; idx++) {
            var n = this.state.data.nodes[idx];
            if (n.id === nid) {
                node = n;
                break;
            }
        }
        return node;
    }

    onNodeDragStopHandlerFn(node) {
        if (node === undefined) {
            return true;
        }
        var nnode = this.findNode(node.id);
        if (nnode !== null) {
            var attrs = nnode.attributes;
            if (attrs !== undefined) {
                return false;
            }
            attrs.xx = parseInt(node.position.x).toString();
            attrs.yy = parseInt(node.position.y).toString();

            nnode.attributes = attrs;
            this.setState({
                selectedNode: nnode,
            });
        }
        return true;
    }

    // delete deleteHyperedge removes a hyperedge from graph, and from internal map
    deleteHyperedge(del) {
        const others = [del.source, del.target];
        const edgeKey = others.join(HYPEREDGE_KEY_DELIMITER);

        // delete hyperlink from backend
        super.deleteLink(edgeKey, true);
    }

    onNodesDeleteHandlerFn(nodes) {
        for (var n of nodes) {
            super.deleteNode(n.id, true);
        }
        return true;
    }

    onEdgesDeleteHandlerFn(edges) {
        for (var e of edges) {
            this.deleteHyperedge(e);
        }
        return true;
    }

    nodeClickHandlerFn(node) {
        var nnode = this.findNode(node.id);
        this.setState({
            selectedNode: nnode,
        });
    }

    nodeDoubleClickHandlerFn(node) {
        var nnode = this.findNode(node.id);
        if (node !== null) {
            nnode.isEditNodeId = true;
            this.setState({
                selectedNode: nnode,
            });
        }

        // edit node details
        this.openNodeDialog();
    }

    onLinkClickHandlerFn(link) {
        for (var l in this.state.data.links) {
            if (l.id === link) {
                this.setState({
                    selectedLink: l,
                });
                break;
            }
        }
    }

    onLinkDoubleClickHandlerFn(link) {
        for (var l in this.state.data.links) {
            if (l.id === link) {
                this.setState({
                    selectedLink: l,
                });
                break;
            }
        }
    }

    // dialog modals for a new node
    renderNodeDialog() {
        if (this.state.selectedNode === undefined || this.state.selectedNode === null) {
            return <></>;
        }

        var entityType = this.state.selectedNode.kind;
        return (
            <>
                <Dialog
                    open={this.state.nodeDialogOpen}
                    onClose={this.handleNodeDialogClose}
                    fullWidth
                >
                    <DialogTitle>{entityType} entity: {this.getSelectedNodeId()}</DialogTitle>
                    <DialogContent dividers={true}>
                        <TextField id="entityId"
                            autoFocus
                            label={`Id: ${this.getSelectedNodeId()}`}
                            type="text"
                            fullWidth
                            variant="standard"
                            disabled={this.state.selectedNode.isEditNodeId === true}
                            placeholder={`e.g. ${this.getSelectedNodeId()}`}
                        /><p />

                        <TextField id="entityName"
                            label={this.state.selectedNode.name === undefined ? "Entity Name" : `Entity Name (${this.state.selectedNode.name})`}
                            type="text"
                            sx={{ width: 255 }}
                            variant="standard"
                            placeholder={this.state.selectedNode.name === undefined ? `e.g. ${this.getSelectedNodeId()}` : `e.g. ${this.state.selectedNode.name}`}
                        />

                        <TextField id="entityKind"
                            label={entityType}
                            type="text"
                            disabled
                            sx={{ ml: 5, width: 255 }}
                            variant="standard"
                            placeholder={entityType}
                            value={entityType}
                        /><p />

                        <TextField id="entityDesc"
                            label={this.state.selectedNode.description === undefined ? "Entity Description" : `Entity Description (${this.state.selectedNode.description})`}
                            type="text"
                            sx={{ width: 255 }}
                            variant="standard"
                            placeholder={this.state.selectedNode.description === undefined ? `e.g. description for ${this.getSelectedNodeId()}` : `e.g. ${this.state.selectedNode.description}`}
                        />

                        <TextField id="entityAttr"
                            label="Entity Attributes"
                            type="text"
                            sx={{ ml: 5, width: 255 }}
                            variant="standard"
                            placeholder="e.g. passcode=46120"
                        /><p />
                    </DialogContent>
                    <DialogActions>
                        {this.showNodeDialogActionsButton()}
                        <Button onClick={this.handleNodeDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleNodeDialogButtonOk}>Ok</Button>
                    </DialogActions>
                </Dialog>

                {this.renderNodeActionsDialog()}
            </>
        );
    }

    // generic render for node actions and specific components
    renderNodeActionsDialog() {
        // act only if non-generic app collection type
        if (IsGenericComponent(this.state.appType)) {
            return <></>;
        }

        if (this.state.selectedNode === undefined || this.state.selectedNode === null) {
            return <></>;
        }

        const genericComponent = GetAppComponent(this.state.selectedNode.kind);
        var AppComp = <React.Fragment></React.Fragment>;
        if (genericComponent !== null) {
            AppComp = React.createElement(genericComponent, {
                groupItemValue: this.state.groupItemValue,
                actionsDialogOpen: this.state.actionsDialogOpen,
                selectedNode: this.state.selectedNode,
                updateActions: this.updateActionsCallbackFn,
                deleteAllActions: this.deleteAllActionsCallbackFn,
            });
        }
        return (<>{AppComp}</>);
    }

    // main render
    render() {
        if (this.snodes.length > 0) {
            return (
                <Paper
                    elevation={0}
                    square={false}
                    sx={{
                        ml: 2, mr: 'auto',
                        with: "100%",
                        height: "100%",
                        boxShadow:
                            "rgb(26 25 43 / 2%) 0px 2.8px 2.2px,rgb(26 25 43 / 2%) 0px 12.5px 10px,rgb(26 25 43 / 2%) 0px 22.3px 17.9px,rgb(26 25 43 / 3%) 0px 41.8px 33.4px,rgb(26 25 43 / 2%) 0px 100px 80px",
                        borderRadius: "0.75rem",
                    }}
                >
                    <CustomNodeFlow
                        key={this.snodes}
                        nodes={this.snodes}
                        links={this.slinks}
                        onNodesChangeHandlerFn={this.onNodesChangeHandlerFn}
                        onEdgesChangeHandlerFn={this.onEdgesChangeHandlerFn}
                        onConnectHandlerFn={this.onConnectHandlerFn}
                        nodeClickHandlerFn={this.nodeClickHandlerFn}
                        onNodesDeleteHandlerFn={this.onNodesDeleteHandlerFn}
                        onNodeDragStopHandlerFn={this.onNodeDragStopHandlerFn}
                        onEdgesDeleteHandlerFn={this.onEdgesDeleteHandlerFn}
                        nodeDoubleClickHandlerFn={this.nodeDoubleClickHandlerFn}
                        onLinkClickHandlerFn={this.onLinkClickHandlerFn}
                        onLinkDoubleClickHandlerFn={this.onLinkDoubleClickHandlerFn}
                    />
                    {this.renderNodeDialog()}
                    {this.renderHyperedgeDialog()}
                </Paper>
            );
        }
        return (
            <>
                {this.renderNodeDialog()}
                {this.renderHyperedgeDialog()}
            </>
        );
    }
}

import React from "react";
import { Component } from "react";
import "./graph.css";
import uuid from 'react-uuid';

import {
    CreateAppEntitiesData, DeleteAppEntityData, UpdateAppEntityData,
    CreateAppAssocsData, UpdateAppAssocData, DeleteAppAssocData,
    FetchAppEntitiesData, FetchAppAssocsData, ObjectToMap,
    CreateEntityActions, DeleteEntityActions, FetchEntityActions,
} from '../../api';

// initial actions form array
export const NO_ACTION_TYPE = "Choose Action Type";
export const HYPEREDGE_KEY_DELIMITER = ",";

// reflects the original actions fields
export const initialActions = {
    id: 'noId',
    name: 'noName',
    type: 'None',
    runxtimes: 1,
    retryxtimes: 1,
    timeout: 50,
};

// max sub-actions per entity
export const MAX_ACTIONS = 10;

// GraphBase is a base React component for managing graphs
export default class GraphBase extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: {
                nodes: [],
                links: [],
            },                               // graph data with nodes, links
            selectedNode: {},                // selected node details
            selectedLink: {
                source: [],
                target: [],
                other: [],
            },                               // selected link {src, target}
            controlKeyPressed: false,        // true if control key was just pressed
            staticGraph: false,              // true if this graph should be static
            nodeDialogOpen: false,           // true if node dialog is open
            actionsDialogOpen: false,        // true if node actions dialog is open
            linkDialogOpen: false,           // true if link dialog is open
            actions: [
                { ...initialActions }
            ],                               // list of action objects per entity

            enableHyperedge: false,            // enable hyperedges showing
            hyperedgeDialogOpen: false,        // true if hyperedge dialog is open
            hyperedgeDialogActionsOpen: false, // true if hyperedge dialog actions is open

            groupItemValue: this.props.group,// group
            appId: this.props.appId,         // this app id
            appType: this.props.appType,     // app type
            appActions: [
                { ...initialActions }
            ],                               // list of all type-specific action data
        }

        // if any critical info are not defined, throw
        if (this.state.groupItemValue == null || this.state.appId == null) {
            throw new Error('graph has no {group, appId}');
        }

        // static graph fixes coordinates
        if (this.props.static != null) {
            this.state.staticGraph = true;
            this.state.graphConfig.staticGraphWithDragAndDrop = true;
        }

        // bindings
        this.onZoomChange = this.onZoomChange.bind(this);
        this.onClickGraph = this.onClickGraph.bind(this);
        this.getRandomInitialCoordinates = this.getRandomInitialCoordinates.bind(this);
        this.getAttrCsvToObj = this.getAttrCsvToObj.bind(this);

        // node routines
        this.getSelectedNodeId = this.getSelectedNodeId.bind(this);
        this.onClickNode = this.onClickNode.bind(this);
        this.onNodePositionChange = this.onNodePositionChange.bind(this);
        this.addNewNode = this.addNewNode.bind(this);
        this.deleteNode = this.deleteNode.bind(this);
        this.onDoubleClickNode = this.onDoubleClickNode.bind(this);
        this.onRightClickNode = this.onRightClickNode.bind(this);

        // node dialog
        this.handleNodeDialogClose = this.handleNodeDialogClose.bind(this);
        this.handleNodeDialogButtonOk = this.handleNodeDialogButtonOk.bind(this);
        this.handleNodeDialogButtonCancel = this.handleNodeDialogButtonCancel.bind(this);
        this.openNodeDialog = this.openNodeDialog.bind(this);
        this.closeNodeDialog = this.closeNodeDialog.bind(this);

        // node dialog updates
        this.createEntityInfo = this.createEntityInfo.bind(this);
        this.updateEntityInfo = this.updateEntityInfo.bind(this);
        this.addEntityApi = this.addEntityApi.bind(this);
        this.updateEntityApi = this.updateEntityApi.bind(this);
        this.deleteEntityApi = this.deleteEntityApi.bind(this);

        // link routines
        this.getSelectedLinkDetails = this.getSelectedLinkDetails.bind(this);
        this.getSelectedLinkId = this.getSelectedLinkId.bind(this);
        this.onClickLink = this.onClickLink.bind(this);
        this.onRightClickLink = this.onRightClickLink.bind(this);
        this.addLink = this.addLink.bind(this);
        this.deleteLink = this.deleteLink.bind(this);
        this.deleteNodesAndLinks = this.deleteNodesAndLinks.bind(this);

        // link dialog
        this.handleLinkDialogClose = this.handleLinkDialogClose.bind(this);
        this.handleLinkDialogButtonCancel = this.handleLinkDialogButtonCancel.bind(this);
        //this.handleLinkDialogButtonOk = this.handleLinkDialogButtonOk.bind(this);
        this.openLinkDialog = this.openLinkDialog.bind(this);
        this.closeLinkDialog = this.closeLinkDialog.bind(this);

        // link dialog updates
        this.getAssocDetails = this.getAssocDetails.bind(this);
        this.updateAssocInfo = this.updateAssocInfo.bind(this);
        this.addAssocApi = this.addAssocApi.bind(this);
        this.updateAssocApi = this.updateAssocApi.bind(this);
        this.deleteAssocApi = this.deleteAssocApi.bind(this);

        //this.handleKeyPress = this.handleKeyPress.bind(this);

        // keyup event for various keyboard events
        //document.addEventListener('keyup', this.handleKeyPress, { passive: true });
        document.addEventListener("contextmenu", (event) => {
            event.preventDefault()
        });

        // fetch entities, assocs
        this.fetchAppEntities = this.fetchAppEntities.bind(this);
        this.fetchAppAssocs = this.fetchAppAssocs.bind(this);

        // fetch callbacks
        this.fetchCompleteFn = null;
        this.setFetchComplete = this.setFetchComplete.bind(this);

        // link callbacks
        this.createLinkCompleteFn = null;
        this.setCreateLinkComplete = this.setCreateLinkComplete.bind(this);
        this.deleteLinkCompleteFn = null;
        this.setDeleteLinkComplete = this.setDeleteLinkComplete.bind(this);

        // node callbacks
        this.deleteNodeCompleteFn = null;
        this.setDeleteNodeComplete = this.setDeleteNodeComplete.bind(this);

        // entity actions
        this.createEntityActions = this.createEntityActions.bind(this);
        this.deleteEntityActions = this.deleteEntityActions.bind(this);
        this.fetchEntityActions = this.fetchEntityActions.bind(this);
        this.resetNodeActions = this.resetNodeActions.bind(this);

        // fetch a list of app entities
        this.fetchAppEntities(this.state.groupItemValue, this.state.appId);
    }

    setFetchComplete(fetchCompleteFn) {
        this.fetchCompleteFn = fetchCompleteFn;
    }

    setCreateLinkComplete(createLinkCompleteFn) {
        this.createLinkCompleteFn = createLinkCompleteFn;
    }

    setDeleteLinkComplete(deleteLinkCompleteFn) {
        this.deleteLinkCompleteFn = deleteLinkCompleteFn;
    }

    setDeleteNodeComplete(deleteNodeCompleteFn) {
        this.deleteNodeCompleteFn = deleteNodeCompleteFn;
    }

    // createEntityActions creates entity actions using internal state actions
    // against the selected entity id
    createEntityActions() {
        var entityId = this.getSelectedNodeId();

        var prom = CreateEntityActions(this.state.groupItemValue, this.state.appId, entityId, this.state.actions);
        prom.then((value) => {
        });
    }

    // delete entity actions via API
    // returns false if any error
    deleteEntityActions(entityId) {
        var prom = DeleteEntityActions(this.state.groupItemValue, this.state.appId, entityId);
        prom.then((value) => {
            if (value.Status !== "success") {
                alert("could not delete actionsfor entity " + entityId + ", reason " + value.message);
                return false;
            }
        });
        return true;
    }

    // fetchEntityActions fetches all actions corresponding to entity
    fetchEntityActions(entityId, callbackFn) {
        var prom = FetchEntityActions(this.state.groupItemValue, this.state.appId, entityId);
        prom.then((value) => {
            // extract actions to represent on UX array from API
            if (callbackFn !== undefined && callbackFn !== null) {
                callbackFn(value.actions);
            }
            var actionsRet = value.actions;
            this.setState({
                actions: actionsRet,
            });
        });
    }

    // reset node actions
    resetNodeActions() {
        var actions = [
            { ...initialActions }
        ];
        this.setState({
            appActions: [],
            actions: actions,
        });
    }

    // graph routines
    onZoomChange(prevZoom, newZoom) {
    }

    // clicking anywhere on the graph adds a new node
    onClickGraph(nodeType) {
        const newId = uuid();
        this.addNewNode(`${nodeType}-${newId}`, nodeType);
    }

    // node routines
    getSelectedNodeId = () => {
        if (this.state.selectedNode != null) {
            return this.state.selectedNode.id;
        }
        return null;
    }

    // clicking selects that node
    onClickNode(nodeId) {
        var isChanged = this.state.selectedNode === null ||
            this.state.selectedNode.id !== nodeId;
        var data = this.state.data;
        var nnodes = data.nodes;
        var selectedNode = this.state.selectedNode;
        for (var n of nnodes) {
            if (n.id === nodeId) {
                n.selected = true;
                selectedNode = n;
            } else if (n.id === this.getSelectedNodeId()) {
                n.selected = false;
            }
        }
        data.nodes = nnodes;

        if (isChanged) {
            // TBD setState() results in async error
            // eslint-disable-next-line
            this.state.data = data;
            // eslint-disable-next-line
            this.state.selectedNode = selectedNode;
            // eslint-disable-next-line
            this.state.selectedLink = {};
        }
    }

    onNodePositionChange(nodeId, x, y) {
    }

    // get random (x,y) coordinates for initial node placement
    getRandomInitialCoordinates = (minx, maxx, miny, maxy) => {
        const rx = Math.floor(Math.random() * (maxx - minx + 1) + minx);
        const ry = Math.floor(Math.random() * (maxy - miny + 1) + miny);
        return [rx, ry];
    }

    // getAttrCsvToObj translates CSV string into attributes object
    // value could be of form "key1=val1,key2=val2"
    // returns attributes object
    getAttrCsvToObj(input) {
        if (input === undefined || input === null || input === "") {
            return {};
        }
        var attrObj = {};
        var value = input.replace(/ /g, "");
        var attrs = value.split(",");
        attrs.forEach((v, k) => {
            var attr = v.split("=");
            if (attr.length > 1) {
                attrObj[attr[0]] = attr[1];
            } else {
                attrObj[attr[0]] = "";
            }
        })
        return attrObj;
    }

    // add a new node to the graph
    addNewNode(newId, nodeType) {
        // add a new node
        var data = this.state.data;
        var nnodes = data.nodes;
        const coord = this.getRandomInitialCoordinates(20, 400, 20, 400);
        var newNode = {
            id: newId,
            kind: nodeType,
            selected: true, // new node auto selected
            created: true,  // node just created
            isEditNodeId: false,
            attributes: {   // copy [x,y] into attributes for render
                xx: coord[0].toString(),
                yy: coord[1].toString(),
            }
        };

        if (this.state.selectedNode != null) {
            const nid = this.getSelectedNodeId();

            // remove earlier selected node
            for (var n of nnodes) {
                if (n.id === nid) {
                    n.selected = false;
                    break;
                }
            }
        }

        // update graph internal state with new node upon create API response
        // TBD setState() results in async error
        // eslint-disable-next-line
        this.state.selectedNode = newNode;

        // open a node editor dialog for the new node
        this.openNodeDialog();
    }

    // delete a node, given id
    // shouldCallApi is used to call API. There are some cases (e.g. dialog cancel)
    // where we have not created this node in the backend, so we shouldn't be deleting via API
    deleteNode(delNodeId, shouldCallApi) {
        if (this.doesNodeHaveLinks(delNodeId)) {
            var err = "Entity " + delNodeId + " has associated links, cannot delete!";
            console.error(err);
            alert(err);
            return;
        }
        this.deleteEntityApi(delNodeId, shouldCallApi);
    }

    // open node dialog modal
    openNodeDialog() {
        this.setState({
            nodeDialogOpen: true,
            actionsDialogOpen: false,
        });
    }

    // close node dialog modal
    closeNodeDialog() {
        this.setState({ nodeDialogOpen: false });
    }

    // double clicking a node opens edit dialog
    onDoubleClickNode(id, node) {
        // edit node details
        var newNode = node;
        newNode.id = id;
        newNode.selected = false;
        newNode.isEditNodeId = true;
        this.setState({
            selectedNode: newNode,
        });
        this.openNodeDialog();
    }

    // add a new entity via API
    // returns false if any error
    addEntityApi(entity) {
        const ent = {
            id: entity.newId,
            name: entity.name,
            kind: entity.kind,
            description: entity.description,
            attributes: entity.attributes,
        }
        const entities = [
            { ...ent }
        ]

        var prom = CreateAppEntitiesData(this.state.groupItemValue, this.state.appId, entities);
        prom.then((value) => {
            // error cases, delete node
            if (value["message"] != null) {
                console.error("error in creating app entities bulk, message: " + value["message"]);
                this.deleteNode(entity.newId, false);
                return false;
            }
            var respEnt = value["entities"];
            if (typeof respEnt == 'undefined' || respEnt == null) {
                console.error("could not create app entities bulk, error: " + value["error"]);
                this.deleteNode(entity.newId, false);
                return false;
            }
            if (respEnt.length !== entities.length) {
                console.error("could not create app entities bulk, requested " +
                    entities.length + ", created " + respEnt.length);
                this.deleteNode(entity.newId, false);
                return false;
            }

            // extract entity just created
            var rentity = respEnt[0];

            // append graph data
            rentity.x = Number(rentity.attributes.xx);
            rentity.y = Number(rentity.attributes.yy);

            // update graph nodes
            var data = this.state.data;
            var nnodes = data.nodes;
            nnodes.push(rentity);
            data.nodes = nnodes;
            this.setState({
                data: data,
                selectedNode: rentity,
            });

            // trigger fetch complete
            if (this.fetchCompleteFn !== null) {
                this.fetchCompleteFn();
            }
        });
        return true;
    }

    // update a specific entity via API
    // returns false if any error
    updateEntityApi(id, newEntity) {
        var prom = UpdateAppEntityData(this.state.groupItemValue, this.state.appId, id, newEntity);
        prom.then((value) => {
            if (String(value["id"]) !== id) {
                alert("could not update app entity " + id);
                return false;
            }
        });
        return true;
    }

    // delete nodes and links
    deleteNodesAndLinks(delNodeId) {
        var data = this.state.data;
        var nnodes = [];
        for (const n of data.nodes) {
            if (n.id !== delNodeId) {
                nnodes.push(n);
            }
        }
        var nlinks = data.links.filter(l => l.source !== delNodeId && l.target !== delNodeId);
        data = {
            nodes: nnodes,
            links: nlinks
        };
        this.setState({
            data: data,
            selectedNode: null,
        });
    }

    // delete a specific entity via API
    // returns false if any error
    deleteEntityApi(delNodeId, shouldCallApi) {
        if (shouldCallApi === false) {
            // only delete the nodes and links in the graph
            this.deleteNodesAndLinks(delNodeId);
            return;
        }

        var prom = DeleteAppEntityData(this.state.groupItemValue, this.state.appId, delNodeId);
        prom.then((value) => {
            if (value.Status !== "success") {
                alert("could not delete app entity " + delNodeId + ", reason " + value.message);
                return false;
            }

            // delete node and links only if API is successful
            this.deleteNodesAndLinks(delNodeId);

            // delete node callback
            if (this.deleteNodeCompleteFn != null) {
                this.deleteNodeCompleteFn(delNodeId);
            }
        });
        return true;
    }

    createEntityInfo(entity) {
        const id = entity.id;
        if (entity.newId == null) entity.newId = id;
        this.addEntityApi(entity);
    }

    // updates entity info a given entity id after node dialog edits
    updateEntityInfo(entity) {
        const id = entity.id;
        if (entity.newId == null) entity.newId = id;

        var data = this.state.data;
        var nnodes = data.nodes;
        var isNodeCreated = false;

        // addNewNode() already added this temporary entity to the list,
        // so we should find the node, and update based on user inputs
        for (var n of nnodes) {
            if (n.id !== id) {
                continue;
            }

            // allow id change only at create
            if (n.created === true) {
                isNodeCreated = true;

                // first replace link with old n.id if set earlier
                var nlinks = data.links;
                for (const l of nlinks) {
                    if (l.source === n.id) l.source = entity.newId;
                    if (l.target === n.id) l.target = entity.newId;
                }
                data.links = nlinks;

                n.id = entity.newId;
                n.created = false;
            }
            n.name = entity.name;
            n.description = entity.description;
            n.kind = entity.kind;
        }

        // update API
        if (isNodeCreated === true) {
            this.addEntityApi(entity);
        } else {
            this.updateEntityApi(id, entity);
        }

        // update graph nodes
        data.nodes = nnodes;
        this.setState({
            data: data,
        });
    }

    // obtain hyperedge key, given a set of vertices
    getHyperedgeKey(vertices) {
        // extract ids of selected vertices
        var ids = [];
        for (var idx = 0; idx < vertices.length; idx++) {
            ids.push(vertices[idx].id);
        }

        ids.sort();

        // find if present in global map
        const kkey = ids.join(HYPEREDGE_KEY_DELIMITER);
        return kkey;
    }

    // handle node dialog to update node info
    handleNodeDialogClose() {
        this.closeNodeDialog();
    }

    handleNodeDialogButtonOk(event) {
        this.handleNodeDialogClose();
        this.closeNodeDialog();

        if (this.getSelectedNodeId() == null) {
            return;
        }

        var entity = this.state.selectedNode;
        var created = !entity.isEditNodeId; // distinguish create vs update

        // consider new entity id input only during creation
        if (created) {
            var input = document.getElementById("entityId");
            if (input != null && input.value !== "") {
                entity.newId = input.value;
            }
        }

        input = document.getElementById("entityName");
        if (input != null && input.value !== undefined && input.value !== "") {
            entity.name = input.value;
        }

        input = document.getElementById("entityKind");
        if (input != null && input.value !== undefined && input.value !== "") {
            entity.kind = input.value;
        }

        input = document.getElementById("entityDesc");
        if (input != null && input.value !== undefined && input.value !== "") {
            entity.description = input.value;
        }

        input = document.getElementById("entityAttr");
        if (input != null && input.value !== undefined && input.value !== "") {
            entity.attributes = this.getAttrCsvToObj(input.value);
        }

        if (created) {
            this.createEntityInfo(entity);
        } else {
            this.updateEntityInfo(entity);
        }
    }

    handleNodeDialogButtonCancel(event) {
        this.closeNodeDialog();

        // if newly created, delete this discarded node
        if (this.state.selectedNode.created === true) {
            this.deleteNode(this.getSelectedNodeId(), false);
        }
    }

    // default link key
    getDefaultLinkKey(source, target) {
        return source + "-" + target;
    }

    onRightClickNode(id) {
        // Control + Right-click on node => add a new link
        if (this.state.controlKeyPressed === true) {
            if (this.state.selectedNode != null) {
                this.addLink({
                    id: this.getDefaultLinkKey(this.getSelectedNodeId(), id),
                    source: this.getSelectedNodeId(),
                    target: id,
                    created: true,
                    isEditLinkId: true,
                });
            }
            this.setState({
                controlKeyPressed: false,
            });
        }
    }

    handleKeyPress(event) {
        if (event.key === 'Backspace') {
            if (this.state.nodeDialogOpen || this.state.linkDialogOpen) {
                return;
            }
            if (this.state.selectedLink != null &&
                this.state.selectedLink.source !== undefined &&
                this.state.selectedLink.target !== undefined) {
                const nLinkId = this.getDefaultLinkKey(
                    this.state.selectedLink.source,
                    this.state.selectedLink.target);
                this.deleteLink(nLinkId, true);
            } else if (this.state.selectedNode != null &&
                this.state.selectedNode.id !== undefined &&
                this.state.selectedNode.id != null) {
                this.deleteNode(this.getSelectedNodeId(), true);
            }
        } else if (event.key === 'Escape') {
            if (this.state.selectedNode != null) {
                this.handleNodeDialogButtonCancel(null);
            } else if (this.state.selectedLink != null) {
                this.handleLinkDialogButtonCancel(null);
            }
        } else if (event.key === 'Control') {
            // TBD setState() results in async error
            // eslint-disable-next-line
            this.state.controlKeyPressed = true;
        }
        return true;
    }

    // link routines
    getSelectedLinkId() {
        if (this.state.selectedLink != null) {
            return this.state.selectedLink.id;
        }
        return null;
    }

    // get selected link details from graph data
    getSelectedLinkDetails(source, target) {
        const data = this.state.data;
        for (var idx = 0; idx < data.links.length; idx++) {
            const link = data.links[idx];
            // we do not expected more than one source -> target link
            if (link.source[0] === source && link.target[0] === target) {
                return link;
            }
        }
        return null;
    }

    onClickLink(source, target) {
        // unselect node
        var data = this.state.data;
        var nnodes = data.nodes;
        for (var n of nnodes) {
            if (n.id === this.getSelectedNodeId()) {
                n.selected = false;
            }
        }
        data.nodes = nnodes;

        const glink = this.getSelectedLinkDetails(source, target);
        this.setState({
            data: data,
            selectedNode: null,
            selectedLink: glink
        });
    }

    // right-click link open link dialog modal for editing
    onRightClickLink(event, source, target) {
        var glink = this.getSelectedLinkDetails(source, target);
        if (glink !== null) {
            glink.isEditLinkId = false;
        }
        this.setState({
            selectedLink: glink
        })
        this.openLinkDialog();
    }

    // add a new link {source, target}
    // return true if a link added successfully
    addLink(newLink) {
        var data = this.state.data;
        const nLinkId = newLink.id;

        // do not add if already existing
        var nlinks = data.links.filter(l => (l.id === newLink.id));
        if (nlinks != null && nlinks.length > 0) {
            console.error(`link already exists: "${nLinkId}"`);
            return false;
        }

        newLink.id = nLinkId;
        newLink.created = false;

        data.links.push(newLink);

        // TBD setState() results in async error
        // eslint-disable-next-line
        this.state.data = data;

        this.addAssocApi(newLink);

        return true;
    }

    // delete an existing link
    // shouldCallApi is used to call API. There are some cases e.g. API response failed
    // where we have not created this association in the backend, but we should be
    // removing from them internal state so as to not render on graph UI
    deleteLink(nLinkId, shouldCallApi) {
        // do not delete if not found
        var data = this.state.data;
        var nlinks = data.links.filter(l => (l.id === nLinkId));
        if (nlinks != null && nlinks.length === 0) {
            console.error(`no link exists: "${nLinkId}"`);
            return;
        }

        // update internal link state
        nlinks = data.links.filter(l => (l.id !== nLinkId));
        data.links = nlinks;
        this.setState({
            data: data,
        });

        if (shouldCallApi) {
            this.deleteAssocApi(nLinkId);
        }
    }

    // open link dialog modal
    openLinkDialog() {
        this.setState({
            linkDialogOpen: true,
        })
    }

    // close link dialog modal
    closeLinkDialog() {
        this.setState({ linkDialogOpen: false });
    }

    // handle link dialog inputs
    handleLinkDialogClose() {
        this.closeLinkDialog();
    }

    // given a nodeId, determine if it has links
    doesNodeHaveLinks(nodeId) {
        var nlinks = this.state.data.links;
        for (var n of nlinks) {
            // source
            for (var s of n.source) {
                if (s === nodeId) {
                    return true;
                }
            }
            // target
            for (s of n.target) {
                if (s === nodeId) {
                    return true;
                }
            }
            // other
            for (s of n.other) {
                if (s === nodeId) {
                    return true;
                }
            }
        }
        return false;
    }

    // given an assocId, extract assoc link details
    getAssocDetails(assocId) {
        var nlinks = this.state.data.links;
        for (var n of nlinks) {
            if (n.id === assocId) {
                return n;
            }
        }
        return null;
    }

    // updates assoc info a given assoc id after link dialog edits
    updateAssocInfo(assoc) {
        const id = assoc.id;
        if (assoc.newId == null) assoc.newId = id;

        var data = this.state.data;
        var nlinks = data.links;
        var isLinkCreated = false;

        for (var n of nlinks) {
            if (n.id === id) {
                // allow id change only at create
                if (n.created === true) {
                    isLinkCreated = true;
                    n.id = assoc.newId;
                    n.created = false;
                }
                n.name = assoc.name;
                n.description = assoc.description;
                n.label = assoc.label;
                n.expressions = assoc.expressions;
                break;
            }
        }

        // update API
        if (isLinkCreated === true) {
            this.addAssocApi(assoc);
        } else {
            this.updateAssocApi(id, assoc);
        }

        data.links = nlinks;
        // TBD setState() results in async error
        // eslint-disable-next-line
        this.state.data = data;

        // callback only during update
        if (!isLinkCreated && this.createLinkCompleteFn != null) {
            this.createLinkCompleteFn();
        }
    }

    // add a new assoc via API
    addAssocApi(assoc) {
        const assocData = {
            id: assoc.id,
            name: assoc.name,
            label: assoc.label,
            description: assoc.description,
            from_entities: assoc.source,
            to_entities: assoc.target,
            other_entities: assoc.other,
            attributes: assoc.attributes,
            expressions: assoc.expressions,
        }
        const newAssocs = [
            { ...assocData }
        ]

        var prom = CreateAppAssocsData(this.state.groupItemValue, this.state.appId, newAssocs);
        prom.then((value) => {
            // error cases, update internal states
            if ((value["assocs"] === undefined) || (value["assocs"].length !== newAssocs.length)) {
                this.closeLinkDialog(); // close any link dialogs if open
                this.deleteLink(assoc.id, false);
                alert(`could not create app assoc ${assoc.id}, bulk requested ${newAssocs.length}`);
                return false;
            }

            // success callback
            if (this.createLinkCompleteFn != null) {
                this.createLinkCompleteFn();
            }
        });
    }

    // update a specific assoc via API
    updateAssocApi(id, newAssoc) {
        const newAssocData = {
            id: id,
            name: newAssoc.name,
            label: newAssoc.label,
            description: newAssoc.description,
            from_entities: newAssoc.source,  // [] from entities
            to_entities: newAssoc.target,    // [] to entities
            other_entities: newAssoc.other,  // [] other entities
            attributes: newAssoc.attributes,
            expressions: newAssoc.expressions,
        }

        var prom = UpdateAppAssocData(this.state.groupItemValue, this.state.appId, id, newAssocData);
        prom.then((value) => {
            // in update error scenarios, restore original state
            // by rereading association entries from backend
            if (String(value["id"]) !== id) {
                this.fetchAppAssocs(this.state.groupItemValue, this.state.appId);

                alert("could not update app assoc " + id);
                return false;
            }
        });
    }

    // delete a specific assoc via API
    deleteAssocApi(nLinkId) {
        var prom = DeleteAppAssocData(this.state.groupItemValue, this.state.appId, nLinkId);
        prom.then((value) => {
            if (value.Status !== "success") {
                alert("could not delete app assoc " + nLinkId + ", reason " + value.message);
                return;
            }
            var data = this.state.data;
            var nlinks = data.links.filter(l => (l.id !== nLinkId));

            data.links = nlinks;
            this.setState({
                data: data,
                selectedLink: {},
            })

            // delete callback
            if (this.deleteLinkCompleteFn !== null) {
                this.deleteLinkCompleteFn();
            }
        });
    }

    // handle link dialog Ok
    handleLinkDialogButtonOk(event) {
        this.closeLinkDialog();

        if (this.getSelectedLinkId() == null) {
            return;
        }
        const source = this.state.selectedLink.source;
        const target = this.state.selectedLink.target;
        var assoc = this.getSelectedLinkDetails(source, target);

        var input = document.getElementById("assocId");
        input = document.getElementById("assocName");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.name = input.value;
        }

        input = document.getElementById("assocLabel");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.label = input.value;
        }

        input = document.getElementById("assocDesc");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.description = input.value;
        }

        input = document.getElementById("assocAttr");
        if (input != null && input.value !== undefined && input.value !== "") {
            assoc.attributes = this.getAttrCsvToObj(input.value);
        }

        // assoc.expressions assumed set already
        assoc.expressions = this.state.selectedLink.expressions;

        this.updateAssocInfo(assoc);
    }

    // handle link dialog cancel
    handleLinkDialogButtonCancel(event) {
        this.closeLinkDialog();
    }

    // fetchAppEntities fetches entities corresponding to appId
    fetchAppEntities(group, appId) {
        var prom = FetchAppEntitiesData(group, appId);
        prom.then((value) => {
            var retm = ObjectToMap(value.entities);
            var nnodes = [];
            retm.forEach((v, k) => {
                v.x = Number(v.attributes.xx);
                v.y = Number(v.attributes.yy);
                nnodes.push(v);
            })
            var data = this.state.data;
            data.nodes = nnodes;

            // TBD setState() results in async error
            // eslint-disable-next-line
            this.state.data = data;
            this.fetchAppAssocs(this.state.groupItemValue, this.state.appId);
        });
    }

    // fetchAppAssocs fetches app associations corresponding to appId
    fetchAppAssocs(group, appId) {
        var prom = FetchAppAssocsData(group, appId);
        prom.then((value) => {
            var retm = ObjectToMap(value.assocs);
            var nlinks = [];
            retm.forEach((v, k) => {
                v.from = JSON.stringify(v.fromentities);
                v.to = JSON.stringify(v.toentities);
                nlinks.push({
                    id: v.id,
                    source: v.fromentities, // [] array of from
                    target: v.toentities,   // [] array of to
                    other: v.otherentities, // [] array of others
                    name: v.name,
                    label: v.label,
                    description: v.description,
                });
            })
            var data = this.state.data;
            data.links = nlinks;
            this.setState({
                data: data,
            })

            // trigger fetch complete
            if (this.fetchCompleteFn !== null) {
                this.fetchCompleteFn();
            }
        });
    }

    // no render for base
    render() {
        return <></>;
    }
}

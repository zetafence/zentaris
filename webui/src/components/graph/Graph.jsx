import React from "react";
import GraphBase from "./GraphBase";
import "./graph.css";
import { Graph as ReactD3Graph } from "react-d3-graph";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { initialGraphConfig } from './consts';

const GRAPH_LINK_KEY_DELIMITER = "-"; // link delimiter needed by React-D3-Graph

export default class Graph extends GraphBase {
    constructor(props) {
        super(props);

        // static graph fixes coordinates
        if (this.props.static != null) {
            this.state.staticGraph = true;
            this.state.graphConfig.staticGraphWithDragAndDrop = true;
        }

        // initial graph config
        this.graphConfig = initialGraphConfig;

        // link routines
        this.onRightClickNode = this.onRightClickNode.bind(this);
        this.addLink = this.addLink.bind(this);
        this.handleLinkDialogButtonOk = this.handleLinkDialogButtonOk.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);

        // graphData hosts nodes, links used by react-d3-graph
        this.graphData = {};

        // selectedLink holds a direct node-node link
        this.selectedLink = "";
        this.reorganizeLinks = this.reorganizeLinks.bind(this);

        // keyup event for various keyboard events
        document.addEventListener('keyup', this.handleKeyPress, { passive: true });
        document.addEventListener("contextmenu", (event) => {
            event.preventDefault()
        });
    }

    // Control + Right-click on node => adds a new link
    onRightClickNode(event, nodeId, node) {
        if (this.state.controlKeyPressed === true) {
            if (this.state.selectedNode != null) {
                this.addLink({
                    id: this.getDefaultLinkKey(this.getSelectedNodeId(), nodeId),
                    source: this.getSelectedNodeId(),
                    target: nodeId,
                    created: true,
                    isEditLinkId: true,
                });
            }
            this.setState({
                controlKeyPressed: false,
            });
        }
    }

    // handle various key press events
    handleKeyPress(event) {
        if (event.key === 'Backspace') {
            // TBD if either of node or link dialogs are open, we do not deletes
            if (this.state.nodeDialogOpen || this.state.linkDialogOpen) {
                return;
            }
            if (this.state.selectedNode != null &&
                this.state.selectedNode.id !== undefined &&
                this.state.selectedNode.id != null) {
                this.deleteNode(this.getSelectedNodeId(), true);
            } else if (this.selectedLink != null &&
                this.selectedLink.source !== undefined &&
                this.selectedLink.target !== undefined) {
                this.deleteLink(this.selectedLink);
            }
        } else if (event.key === 'Escape') {
            if (this.state.selectedNode != null) {
                this.handleNodeDialogButtonCancel(null);
            } else if (this.selectedLink != null) {
                this.handleLinkDialogButtonCancel(null);
            }
        } else if (event.key === 'Control') {
            this.setState({
                controlKeyPressed: true,
            })
        }
        return true;
    }

    // obtain default link key
    getDefaultLinkKey(source, target) {
        return source + GRAPH_LINK_KEY_DELIMITER + target;
    }

    // obtain selected link id
    getSelectedLinkId() {
        if (this.selectedLink != null) {
            return this.getDefaultLinkKey(this.selectedLink.source,
                this.selectedLink.target);
        }
        return "";
    }

    // add a new link {source, target}
    addLink(newLink) {
        var data = this.state.data;
        const source = newLink.source,
            target = newLink.target;
        const nLinkId = this.getDefaultLinkKey(source, target);

        // do not add if already existing
        var nlinks = data.links.filter(l => (l.source === newLink.source && l.target === newLink.target));
        if (nlinks != null && nlinks.length > 0) {
            console.error(`link already exists: "${nLinkId}"`);
            return;
        }

        newLink.id = nLinkId;
        newLink.created = false;

        // source, target should be node ids
        delete newLink.source;
        delete newLink.target;
        newLink.source = [source];
        newLink.target = [target];

        this.addAssocApi(newLink);

        data.links.push(newLink);
        this.setState({
            data: data,
        })
    }

    // delete an existing link
    deleteLink(delLink) {
        if (delLink.source === undefined || delLink.target === undefined ||
            delLink.source.length === 0 || delLink.target.length === 0) {
            return;
        }

        const source = delLink.source[0];
        const target = delLink.target[0];
        const nLinkId = this.getDefaultLinkKey(source, target);

        // do not delete if not found
        var data = this.state.data;
        var nlinks = data.links.filter(l => (l.source === source && l.target === target));
        if (nlinks != null && nlinks.length === 0) {
            console.error(`no link exists: "${nLinkId}"`);
            return;
        }
        this.deleteAssocApi(nLinkId);
    }

    // handle link dialog Ok. We handle this different than the base class
    // because source, targets are indvidual ids instead of arrays otherwise
    handleLinkDialogButtonOk(event) {
        this.closeLinkDialog();

        if (this.getSelectedLinkId() == null) {
            return;
        }
        const source = this.selectedLink.source;
        const target = this.selectedLink.target;
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
        this.updateAssocInfo(assoc);
    }

    // reorganizeLinks gets invoked from render(), which will be called every time there is
    // a change in local class state. We're looking for changes to nodes and
    // links, and re-render them appropriate to d3-react-graph
    reorganizeLinks() {
        var links = this.state.data.links;
        var newLinks = [];
        for (var idx = 0; idx < links.length; idx++) {
            const link = links[idx];
            // choose links with both from/to
            if (link.source.length > 0 && link.target.length > 0) {
                // TBD choose just index 0
                const source = link.source[0],
                    target = link.target[0];
                newLinks.push({
                    id: this.getDefaultLinkKey(source, target),
                    source: source,
                    target: target,
                    label: link.label,
                    description: link.description,
                    created: true,
                });
            }
        }

        // set internal state for rendering
        this.graphData = {
            nodes: this.state.data.nodes,
            links: newLinks
        };

        // update selectedLink key
        this.selectedLink = "";
        if (this.state.selectedLink !== null &&
            this.state.selectedLink.source.length > 0 &&
            this.state.selectedLink.target.length > 0) {
            // TBD choose just index 0
            const source = this.state.selectedLink.source[0],
                target = this.state.selectedLink.target[0];
            this.selectedLink = { source: source, target: target };
        }
    }

    // main graph UX render
    render() {
        return (
            <div className="graph">
                {this.reorganizeLinks()}
                <ReactD3Graph id="graph-id" ref="graph"
                    data={this.graphData}
                    config={this.graphConfig}
                    onClickNode={this.onClickNode}
                    onClickLink={this.onClickLink}
                    onRightClickNode={this.onRightClickNode}
                    onZoomChange={this.onZoomChange}
                    onNodePositionChange={this.onNodePositionChange}
                    onClickGraph={this.onClickGraph}
                    onDoubleClickNode={this.onDoubleClickNode}
                    onRightClickLink={this.onRightClickLink}
                />

                <Dialog
                    open={this.state.nodeDialogOpen}
                    onClose={this.handleNodeDialogClose}
                    fullWidth
                >
                    <DialogTitle>Entity: {this.getSelectedNodeId()}</DialogTitle>
                    <DialogContent>
                        <TextField id="entityId"
                            autoFocus
                            label={`Id: ${this.getSelectedNodeId()}`}
                            type="text"
                            fullWidth
                            variant="standard"
                            disabled={this.state.selectedNode !== null && this.state.selectedNode.isEditNodeId === true}
                            placeholder={`e.g. ${this.getSelectedNodeId()}`}
                        /><p />

                        <TextField id="entityName"
                            label={this.state.selectedNode === null || this.state.selectedNode.name === undefined ? "Entity Name" : `Entity Name (${this.state.selectedNode.name})`}
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder={this.state.selectedNode === null || this.state.selectedNode.name === undefined ? `e.g. ${this.getSelectedNodeId()}` : `e.g. ${this.state.selectedNode.name}`}
                        /><p />

                        <TextField id="entityKind"
                            label={this.state.selectedNode === null || this.state.selectedNode.kind === undefined ? "Entity Kind" : `Entity Kind (${this.state.selectedNode.kind})`}
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder={this.state.selectedNode === null || this.state.selectedNode.kind === undefined ? "e.g. user" : `e.g. ${this.state.selectedNode.kind}`}
                        /><p />

                        <TextField id="entityDesc"
                            label={this.state.selectedNode === null || this.state.selectedNode.description === undefined ? "Entity Description" : `Entity Description (${this.state.selectedNode.description})`}
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder={this.state.selectedNode === null || this.state.selectedNode.description === undefined ? `e.g. description for ${this.getSelectedNodeId()}` : `e.g. ${this.state.selectedNode.description}`}
                        /><p />

                        <TextField id="entityAttr"
                            label="Entity Attributes"
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder="e.g. passcode=46120"
                        /><p />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleNodeDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleNodeDialogButtonOk}>Ok</Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={this.state.linkDialogOpen}
                    onClose={this.handleLinkDialogClose}
                    fullWidth
                >
                    <DialogTitle>Association: {this.selectedLink.source} to {this.selectedLink.target}</DialogTitle>
                    <DialogContent>
                        <TextField id="assocName"
                            label={this.selectedLink !== null && this.selectedLink.name !== undefined ? `Assoc Name (${this.selectedLink.name})` : "Assoc Name"}
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder={this.selectedLink !== null && this.selectedLink.name !== undefined ? `e.g. ${this.selectedLink.name}` : "Assoc Name"}
                        /><p />

                        <TextField id="assocLabel"
                            label={this.selectedLink !== null && this.selectedLink.label !== undefined ? `Assoc Label (${this.selectedLink.label})` : "Assoc Label"}
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder={this.selectedLink !== null && this.selectedLink.label !== undefined ? `e.g. Assoc Label ${this.selectedLink.label}` : "Assoc Label"}
                        /><p />

                        <TextField id="assocDesc"
                            label={this.selectedLink !== null && this.selectedLink.description !== undefined ? `Assoc Description (${this.selectedLink.description})` : "Assoc Description"}
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder={this.selectedLink !== null && this.selectedLink.description !== undefined ? `e.g. Assoc Description ${this.selectedLink.description}` : "Assoc Description"}
                        /><p />

                        <TextField id="assocAttr"
                            label="Assoc Attributes"
                            type="text"
                            fullWidth
                            variant="standard"
                            placeholder={`e.g. passcode=14053`}
                        /><p />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleLinkDialogButtonCancel}>Cancel</Button>
                        <Button onClick={this.handleLinkDialogButtonOk}>Ok</Button>
                    </DialogActions>
                </Dialog>
            </div >
        )
    }
}

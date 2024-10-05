import React from "react";
import GraphBase from "./GraphBase";
import "./graph.css";
import { schemeCategory10 as d3SchemeCategory10 } from 'd3-scale-chromatic';
import { select as d3Select } from 'd3-selection';
import { event as d3Event } from 'd3-selection';
import { forceManyBody as d3ForceManyBody } from 'd3-force';
import { forceCollide as d3ForceCollide } from 'd3-force';
import { forceCenter as d3ForceCenter } from 'd3-force';
import { forceLink as d3ForceLink } from 'd3-force';
import { forceSimulation as d3ForceSimulation } from "d3-force";
import { drag as d3Drag } from 'd3-drag';
import { zoom as d3Zoom } from 'd3-zoom';
import Paper from "@mui/material/Paper";

// graph canvas
const GRAPH_CANVAS_WIDTH = 800,
    GRAPH_CANVAS_HEIGHT = 800;

const TooltipStyles = {
    width: 'auto',
    height: 'auto',
    padding: '10px',
    margin: '8px',
    'background-color': 'lightgray',
    'border-radius': '5px',
    border: '1px solid black',
    'z-index': 10,
};

const COMMUNITY_UNDEFINED = 99,
    COMMUNITY_NONE = -1,
    NODE_RADIUS_DEFAULT = 10;

// find unique arrays based on property
const UNION_ENTITIES = "entitiesUNION";
function findUniqueArrays(array, property) {
    const uniqueArrays = [];
    const seenValues = new Set();

    for (const obj of array) {
        // convert array to a string for comparison
        const values = obj[property].join(',');
        if (!seenValues.has(values)) {
            seenValues.add(values);
            uniqueArrays.push(obj[property]);
        }
    }

    return uniqueArrays;
}

// VisualizeGraph renders graph in visual manner
export default class VisualizeGraph extends GraphBase {
    constructor(props) {
        super(props);

        // myRef refers to the react DOM component for D3
        this.myRef = React.createRef();

        this.fetchCompleteInit = this.fetchCompleteInit.bind(this);
        super.setFetchComplete(this.fetchCompleteInit);

        this.generateTooltip = this.generateTooltip.bind(this);
        this.updateTooltip = this.updateTooltip.bind(this);
        this.generateZoom = this.generateZoom.bind(this);
        this.addNode = this.addNode.bind(this);
        this.addEdge = this.addEdge.bind(this);
        this.renderSimulation = this.renderSimulation.bind(this);
        this.refreshSimulation = this.refreshSimulation.bind(this);
        this.addNodesAndEdges = this.addNodesAndEdges.bind(this);

        const containerId = "graphCanvas",
            width = GRAPH_CANVAS_WIDTH,
            height = GRAPH_CANVAS_HEIGHT;

        this.containerId = containerId;
        this.width = width;
        this.height = height;

        this.colors = d3SchemeCategory10
            .concat()
            .reverse()
            .concat('Pink', 'lime', 'tomato');

        this.nodeRadius = (d) => NODE_RADIUS_DEFAULT + d.community.length * 3;

        // create a simulation using d3-force
        this.simulation = d3ForceSimulation()
            .force('charge', d3ForceManyBody().strength(-15))
            .force(
                'link',
                d3ForceLink()
                    .id((d) => d.id)
                    .distance(450)
            )
            .force('collide', d3ForceCollide(this.nodeRadius))
            .force('center', d3ForceCenter(width / 2, height / 2));

        // build SVG element within the specified container
        this.svg = d3Select(`#${containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        this.g = this.svg.append('g');

        // init radial gradient definitions on SVG
        this.initRadialGradient = this.initRadialGradient.bind(this);

        // initialize internal data
        this.communities = [];
        this.nodes = [];
        this.links = [];
        this.assocs = [];
    }

    // callback when fetch of graph elements complete
    fetchCompleteInit() {
        // pre-calculation before render: determine the union set of all 3 entity sets
        var assocs = this.state.data.links;
        for (let i = 0; i < assocs.length; i++) {
            assocs[i][UNION_ENTITIES] = [];
            if (assocs[i]['other'] !== undefined) {
                for (let k = 0; k < assocs[i]['other'].length; k++) {
                    let elem = assocs[i]['other'][k];
                    assocs[i][UNION_ENTITIES].push(elem);
                }
            }
            if (assocs[i]['source'] !== undefined) {
                for (let k = 0; k < assocs[i]['source'].length; k++) {
                    let elem = assocs[i]['source'][k];
                    assocs[i][UNION_ENTITIES].push(elem);
                }
            }
            if (assocs[i]['target'] !== undefined) {
                for (let k = 0; k < assocs[i]['target'].length; k++) {
                    let elem = assocs[i]['target'][k];
                    assocs[i][UNION_ENTITIES].push(elem);
                }
            }
        }

        var data = this.state.data;
        data.links = assocs;
        this.state.data = data;

        // form communities of related edges and associations
        this.communities = findUniqueArrays(assocs, UNION_ENTITIES);

        // this.addNodesAndEdges(data.entities, data.assocs);
        this.addNodesAndEdges(this.state.data.nodes, this.state.data.links);

        this.forceUpdate();
    }

    getNodeCommunity(nodeId) {
        let comms = [];
        for (let i = 0; i < this.communities.length; i++) {
            let comm = this.communities[i];
            for (let k = 0; k < comm.length; k++) {
                if (nodeId === comm[k]) {
                    comms.push(i);
                }
            }
        }
        return comms;
    }

    findNodeCommunity(nodeId, assocs) {
        let community = [""];
        if (nodeId === undefined || assocs === undefined) {
            return community;
        }

        for (let i = 0; i < assocs.length; i++) {
            let assoc = assocs[i];
            let source = assoc['source'],
                target = assoc['target'],
                other = assoc['other'];
            if (assoc === undefined || source === undefined ||
                target === undefined || other === undefined) {
                continue;
            }
            let hedge = "";
            if (source.includes(nodeId) || target.includes(nodeId) || other.includes(nodeId)) {
                hedge = source.concat(target, other);
                hedge = hedge.filter(item => item !== nodeId);
            }
            if (hedge !== "") {
                community = community.concat(" [ " + hedge.join(",") + " ] ");
            }
        }
        return community;
    }

    findLinkCommunity(assoc) {
        // source community
        let scom = [];
        for (let i = 0; i < assoc.source.length; i++) {
            let sc = this.getNodeCommunity(assoc.source[i]);
            for (let k = 0; k < sc.length; k++) {
                if (!scom.includes(sc[k])) {
                    scom.push(sc[k]);
                }
            }
        }

        // target community
        let tcom = [];
        for (let i = 0; i < assoc.target.length; i++) {
            let tc = this.getNodeCommunity(assoc.target[i]);
            for (let k = 0; k < tc.length; k++) {
                if (!tcom.includes(tc[k])) {
                    tcom.push(tc[k]);
                }
            }
        }

        // find common between source, target
        let common = [];
        for (let elem of scom) {
            if (tcom.includes(elem)) {
                common.push(elem);
            }
        }

        let community = COMMUNITY_NONE;
        if (common.length === 1) {
            community = common[0];
        }
        return community;
    }

    addNodesAndEdges(entities, assocs) {
        // add nodes
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i];

            // fitness
            let fitness = entity['fitness'];
            if (fitness === undefined) {
                fitness = Math.random() * 4;
            }
            fitness = Math.random() * 6;
            this.addNode(entity.id, entity.name, {
                fitness: fitness,
                kind: entity['kind'],
                label: entity['kind'],
                attributes: entity['attributes'],
                community: this.findNodeCommunity(entity.id, assocs),
            });
        }

        // add hyperedges with distinct colors
        let amap = new Map(),
            linkColors = d3SchemeCategory10,
            linkColorIdx = 0;

        for (let i = 0; i < assocs.length; i++) {
            let assoc = assocs[i];
            let source = assoc['source'];
            let target = assoc['target'];
            let other = assoc['other'];

            if (assoc === undefined || source === undefined ||
                target === undefined) {
                continue;
            }

            // propensity
            let propensity = assoc['propensity'];
            if (propensity === undefined) {
                propensity = Math.random() * 4;
            }

            let all = source.concat(target, other).sort();
            let kkey = all.join('-');

            // if already added, skip
            if (amap.get(kkey) === true) {
                continue;
            }

            amap.set(kkey, true);

            // add last->first link to connect hyperedges
            if (all.length >= 3) {
                all = all.concat(all[0]);
            }

            // pick 2 entities at a time
            for (let i = 0; i < all.length; i += 1) {
                let color = linkColors[linkColorIdx];
                linkColorIdx++; linkColorIdx = linkColorIdx % 10;
                if (i + 1 < all.length) {
                    // add edge now
                    this.addEdge(
                        all[i],
                        all[i + 1],
                        color,
                        {
                            propensity: propensity,
                            label: assoc['label'],
                            attributes: assoc['attributes'],
                            community: this.findLinkCommunity(assoc),
                        }
                    );
                }
            }
        }
    }

    // Method to add nodes to the graph
    addNode(nodeId, nodeName, attributes) {
        this.nodes.push({ id: nodeId, name: nodeName, ...attributes });
    }

    // Method to add edges to the graph
    addEdge(sourceId, targetId, color, attributes) {
        this.links.push({
            source: sourceId,
            target: targetId,
            color: color,
            ...attributes
        });
    }

    // Method to generate a tooltip for a node or edge
    generateTooltip() {
        // add tooltip to HTML body
        this.nodeTooltip = d3Select("body")
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden');

        for (const prop in TooltipStyles) {
            this.nodeTooltip.style(prop, TooltipStyles[prop]);
        }
    }

    updateTooltip(d) {
        let event = d3Event;
        let content = [];

        // tooltip title
        content.push(`<div><h3>${d.id}</h3></div>`);
        content.push(`<div><h3>${d.kind}</h3></div>`);

        // iterate over each attribute object to render
        if (d.attributes !== undefined) {
            for (const [key, value] of Object.entries(d.attributes)) {
                content.push(`<div><b>${key}: </b><span>${value}</span></div>`);
            }
        }

        if (d.community !== COMMUNITY_UNDEFINED && d.community !== undefined &&
            d.community.length !== 0) {
            content.push(`<div><b>Hyperedges: </b> ${d.community.join(" ")} </span></div>`);
        }

        let contentStr = '';
        content.map((d) => (contentStr += d));

        this.nodeTooltip
            .html(`${contentStr}`)
            .style('top', event.y - 40 - content.length * 30 + 'px') // adjust starting point of tooltip div to minimise chance of overlap with node
            .style('left', event.x - 40 + 'px');
    }

    labelToCommunity(label) {
        if (label === undefined) {
            return 0;
        }
        // check if the input is a valid string
        if (typeof label !== 'string' || label.length === 0) {
            console.error('Invalid input. Please provide a non-empty string.');
            return 0;
        }

        // sum up the ASCII values of characters in the string
        let sum = 0;
        for (let i = 0; i < label.length; i++) {
            sum += label.charCodeAt(i);
        }

        // Take the modulo 10 to get a number between 0 and 9
        const community = (4 + sum) % 10;
        return community;
    }

    generateZoom() {
        var svg = d3Select(this.myRef.current);
        var g = svg.selectAll('g');
        var zoomHandler = d3Zoom().on('zoom', function (event) {
            g.attr('transform', d3Event.transform);
        });

        svg.call(zoomHandler);
    }

    refreshSimulation() {
        function transform(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }

        function linkArc(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        }

        var svg = d3Select(this.myRef.current);
        var g = svg.selectAll('g');

        var nodes = g.selectAll('.node')
            .data(this.nodes);
        var text = g.selectAll(".label")
            .data(this.nodes);
        var links = g.selectAll(".link")
            .data(this.links);

        // on tick simulation event
        if (this.simulation != null) {
            this.simulation.on('tick', () => {
                nodes.attr("transform", transform);
                links.attr("d", linkArc);
                text.attr("transform", transform);
            });
        }
    }

    // initialize radial gradient definition on SVG
    initRadialGradient(svg) {
        const defs = svg.append('defs');

        // append a radialGradient element to the defs and give it a unique id
        this.colors.forEach((color) => {
            var radialGradient = defs
                .append("radialGradient")
                .attr("id", "radial-gradient-" + color)
                .attr("cx", "50%")  // x-coordinate of the center of the gradient
                .attr("cy", "50%")  // y-coordinate of the center of the gradient
                .attr("r", "50%");  // radius of the gradient, relative to the size of the element

            // Add color stops to the gradient
            radialGradient.append("stop")
                .attr("offset", "0%")
                .style("stop-color", "#FFF");

            radialGradient.append("stop")
                .attr("offset", "90%")
                .style("stop-color", color);
        });

        // append a slight dropshadow to give a faux 3D effect
        defs.append('filter')
            .attr('id', 'drop-shadow')
            .append('feDropShadow')
            .attr('dx', 1.5)
            .attr('dy', 1.5)
            .attr('flood-color', 'lightsilvergray')
            .attr('stdDeviation', 0.8);
    }

    componentDidMount() {
        var svg = d3Select(this.myRef.current);
        this.initRadialGradient(svg);
    }

    renderSimulation() {
        let that = this;
        var svg = d3Select(this.myRef.current);
        var g = svg.selectAll('g');
        if (g.empty()) {
            g = svg.append('g');
        }
        const simulation = this.simulation;

        simulation.nodes(this.nodes).on('tick', () => {
            link.attr('d', (d) => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            });

            node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
            text.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
        });

        simulation.force('link').links(this.links);

        // create links
        const link = g.selectAll('.link')
            .data(this.links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('stroke', (d) => d.color)
            .style('stroke-width', (d) => Math.pow(d.propensity, 1) + 2)
            .attr('cursor', 'pointer')
            .attr('d', (d) => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            });

        // create nodes
        const node = g.selectAll('.node')
            .data(this.nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', this.nodeRadius)
            .style('fill', (d) => this.colors[this.labelToCommunity(d.label)])
            .style('filter', 'url(#drop-shadow)')
            .attr('cursor', 'pointer')
            .call(d3Drag()
                .on('start', (d) => {
                    if (!d3Event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (d) => {
                    d.fx = d3Event.x;
                    d.fy = d3Event.y;
                })
                .on('end', (d) => {
                    if (!d3Event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                    if (!d3Event.active) simulation.alpha(0.3)
                })
            )
            .on('mouseover', function (dd) {
                d3Event.preventDefault();
                that.updateTooltip(dd);
                that.nodeTooltip
                    .style('visibility', 'visible')
            })
            .on('mouseout', function (event, dd) {
                that.nodeTooltip.style('visibility', 'hidden');
            });

        const text = g
            .selectAll('.label')
            .data(this.nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', this.nodeRadius)
            .attr('dx', 3)
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'start')
            .attr('fill', 'black')
            .attr('font-size', 11)
            .text((d) => {
                let inputString = d.id;
                let maxLength = 10;
                if (inputString.length <= maxLength) {
                    return inputString;
                }
                const firstCharacter = inputString.slice(0, 5);
                const lastCharacter = inputString.slice(
                    inputString.length - 5,
                    inputString.length
                );
                const truncatedString = firstCharacter + '...' + lastCharacter;
                return truncatedString;
            });

        // refresh simulation
        this.refreshSimulation();
    }

    // Method to render the graph
    render() {
        return (
            <Paper
                elevation={1}
                square={false}
                style={{ background: "#d8d8d8" }}
                sx={{
                    ml: 2, mr: 2,
                    boxShadow: "rgb(26 25 43 / 2%) 0px 2.8px 2.2px,rgb(26 25 43 / 2%) 0px 12.5px 10px,rgb(26 25 43 /     2%) 0px 22.3px 17.9px,rgb(26 25 43 / 3%) 0px 41.8px 33.4px,rgb(26 25 43 / 2%) 0px 100px 80px",
                    borderRadius: "0.75rem",
                    flexWrap: "wrap", overflow: 'hidden',
                    width: '100%', height: '100%'
                }}
            >
                <svg ref={this.myRef} width='100%' height='100%'></svg>

                {this.generateTooltip()}
                {this.generateZoom()}
                {this.renderSimulation()}
            </Paper>
        );
    }
}

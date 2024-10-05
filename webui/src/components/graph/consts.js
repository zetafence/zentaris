import React from "react";
import CustomNode from "./CustomNode";

// initial graph config for react-d3-graph
export const initialGraphConfig = {
    directed: true,
    nodeHighlightBehavior: false,
    linkHighlightBehavior: true,
    highlightDegree: 0,
    highlightOpacity: 1, // make this 0 to highlight node upon mouse over
    collapsible: false,
    automaticRearrangeAfterDropNode: false,
    freezeAllDragEvents: false,
    focusAnimationDuration: 5.75,
    maxZoom: 5,
    minZoom: 0.1,
    focusZoom: 1,
    staticGraph: false,
    staticGraphWithDragAndDrop: false,
    d3: {
        alphaTarget: 0.05,
        linkLength: 50,
        gravity: -200,
        disableLinkForce: false
    },
    node: {
        color: "lightblue",
        highlightColor: "red",
        renderLabel: false,
        size: 500,
        highlightFontSize: 25,
        highlightFontWeight: "bold",
        highlightStrokeColor: "red",
        highlightStrokeWidth: 10,
        symbolType: "diamond",
        opacity: 2,
        viewGenerator: node => <CustomNode node={node} />,
    },
    link: {
        highlightColor: "red",
        highlightFontSize: 8,
        renderLabel: true,
        strokeWidth: 5,
        markerWidth: 5,
        markerHeight: 10,
        strokeLinecap: "butt",
        strokeDasharray: 8,
        type: "CURVE_SMOOTH"
    },
};

import React from "react";

const iconTypeMap = {
    user: 'customIconFemale',
    male: 'customIconMale',
    female: 'customIconFemale',
    rest: 'customIconRest',
    car: 'customIconCar',
    diamond: 'customIconDiamond',
    keypad: 'customIconKeypad',
};

// Component that renders icons and labels
export default function CustomNode({ node }) {
    // get icon for specific node types
    function getIcon(node) {
        var iconClass = "customIcon";
        if (node.kind !== undefined && iconTypeMap[node.kind]) {
            iconClass = iconTypeMap[node.kind];
        }
        return (
            <div className={iconClass}></div>
        );
    }

    function getName(node) {
        if (node.name != null) {
            return node.name;
        }
        return node.id;
    }

    var selected = "";
    if (node.selected != null && node.selected === true) {
        selected = "highlight";
    }

    return (
        <div className={`custom-container person-node ${node.gender} ${selected}`}>
            <div className="name">{getName(node)}</div>
            <div className="custom-container custom-fill-space custom-container-row">
                <div className="custom-fill-space">
                    {getIcon(node)}
                </div>
            </div>
        </div>
    );
}

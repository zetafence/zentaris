import React, { Component } from "react";
import Tooltip from '@mui/material/Tooltip';

import zfLogo from "../../images/logo.png";
import rest from "./images/rest.png";
import expr from "./images/expr.png";
import slack from "./images/slack.png";
import email from "./images/email.png";
import messages from "./images/messages.png";
import alertsImg from "./images/alerts.png";
import logsImg from "./images/logs.png";
import chatgptImg from "./images/chatgpt.png";
import k8s from "./images/k8s.png";
import usersImg from "./images/users.png";
import groupsImg from "./images/groups.png";
import policiesImg from "./images/policies.png";
import polpImg from "./images/polp.png";
import jwtImg from "./images/jwt.png";
import secretImg from "./images/secret.png";
import k8sImg from "./images/k8s.png";
import scanImg from "./images/scan.png";
import reportImg from "./images/report.png";
import cisImg from "./images/cis.png";

// list of generic app action components
import AppEmpty from "./AppEmpty";

const DEFAULT_ICON_IMAGE = zfLogo;
const K8S_TYPE = "k8s-";

// GetEntityIcon obtains a specific image based on node kind
export function GetEntityIcon(kind) {
    if (kind === undefined) {
        return DEFAULT_ICON_IMAGE;
    }
    // any k8s type
    if (kind.toLowerCase().startsWith(K8S_TYPE)) {
        return k8s;
    }
    switch (kind.toLowerCase()) {
        case 'generic':
            return zfLogo;
        case 'rest':
            return rest;
        case 'expr':
            return expr;
        case 'slack':
            return slack;
        case 'email':
            return email;
        case 'messages':
            return messages;
        case 'alerts':
            return alertsImg;
        case 'logs':
            return logsImg;
        case 'chatgpt':
            return chatgptImg;
        case 'users':
            return usersImg;
        case 'groups':
            return groupsImg;
        case 'policies':
            return policiesImg;
        case 'polp':
            return polpImg;
        case 'groupjwt':
            return jwtImg;
        case 'secret':
            return secretImg;
        case 'newk8sconfig':
            return k8sImg;
        case 'scank8sconfigsecurity':
            return scanImg;
        case 'k8security':
            return k8sImg;
        case 'report':
            return reportImg;
        case 'cis':
            return cisImg;
        default:
            return DEFAULT_ICON_IMAGE;
    }
}

// a list of entity action components
const appComponentMap = {
    // UPDATE whenever a new component is added with lowercase keys
    generic: AppEmpty,
    /*
    expr: AppExpr,
    rest: AppRest,
    slack: AppSlack,
    email: AppEmail,
    chatgpt: AppChatGPT,
    users: AppUsers,
    groups: AppGroups,
    groupjwt: AppGroupJWT,
    policies: AppPolicies,
    polp: AppPoLP,
    secret: AppSecret,
    newk8sconfig: AppEmpty,
    scank8sconfigsecurity: AppScanSecurity,
    k8security: AppK8sSecurity,
    report: AppReport,
    cis: AppCis,
    */
};

// GetAppComponent obtains the right app component, given the entity type
export function GetAppComponent(entityType) {
    if (entityType === undefined) {
        return AppEmpty;
    } else if (entityType.startsWith(K8S_TYPE)) {
        return AppEmpty;
    }
    return appComponentMap[String(entityType).toLowerCase()];
}

// TBD if any generic app collection that does not need "middle app bar", add here
const _appCollectionGeneric = ["visualize"];

// IsGenericComponent returns true if entity type is generic
// generic components have special treatment, no actions, etc.
export function IsGenericComponent(appCollType) {
    return _appCollectionGeneric.includes(appCollType.toLowerCase());
}

// class that returns an icon as component
// usage: <IconComponent kind="generic" />
export class IconComponent extends Component {
    constructor(props) {
        super(props);

        // local state
        this.state = {
            iconKind: "generic",
            appImage: "",
            onClickFn: "",
        };

        // props verification
        if (this.props.kind !== undefined) {
            this.state.iconKind = this.props.kind;
        }
        this.state.appImage = GetEntityIcon(this.props.kind);
        if (this.props.onClickFn !== undefined) {
            this.state.onClickFn = this.props.onClickFn;
        }
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        if (this.state.onClickFn !== undefined) {
            this.state.onClickFn(this.state.iconKind);
        }
    }

    render() {
        const imgStyle = {
            cursor: 'pointer'
        };
        return (
            <>
                <Tooltip title={this.state.iconKind}>
                    <img src={this.state.appImage}
                        alt="appImage"
                        onClick={() => this.handleClick()}
                        onmouseover={this.state.appImage}
                        width="40" height="40"
                        style={imgStyle}
                    />
                </Tooltip>
            </>
        );
    }
}

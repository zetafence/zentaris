import { GetDefaultOrg, GetDefaultHttpAgent, GetDefaultHeaders, BackendServer } from "./common";
const util = require('util');

const DefaultOrg = GetDefaultOrg();

// URL constants
const _getAppUrl = "https://%s/v1/apps",
    _getAttackGraphUrl = "https://%s/v1/attackGraphs",
    _getAppEntitiesUrl = "https://%s/v1/app/%s/entities",
    _getAppAssocsUrl = "https://%s/v1/app/%s/assocs",
    _evalAppUrl = "https://%s/v1/app/%s/eval";

export function getappUrl(org, group) {
    return util.format(_getAppUrl, BackendServer);
}

export function getAttackGraphUrl(org, group) {
    return util.format(_getAttackGraphUrl, BackendServer);
}

export function getAppEntitiesUrl(org, group, appId) {
    return util.format(_getAppEntitiesUrl, BackendServer, appId);
}

export function getAppAssocsUrl(org, group, appId) {
    return util.format(_getAppAssocsUrl, BackendServer, appId);
}

export function getAppEvalUrl(org, group, appId) {
    return util.format(_evalAppUrl, BackendServer, appId);
}

// GetAppDataFromJSON obtains a list of apps from given JSON
export function GetAppDataFromJSON(data) {
    var apps = new Map(),
        jsonData = JSON.parse(data),
        appsArr = jsonData.apps;

    try {
        appsArr.forEach(d => {
            apps.set(d.id, {
                appId: d.id,
                type: d.type,
                name: d.name,
                description: d.description
            });
        });
    } catch (error) {
    }
    return Object.fromEntries(apps);
};

// FetchAppsData fetches apps async
export async function FetchAppsData(group, isAttackGraph) {
    var dUrl = getappUrl(DefaultOrg, group);
    if (isAttackGraph) {
        dUrl = getAttackGraphUrl(DefaultOrg, group);
    }

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            credentials: 'omit',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch apps for ${group}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var apiData = await response.text();
    return apiData;
};

// FetchAppEntitiesData fetches all app entities async
export async function FetchAppEntitiesData(group, appId) {
    const dUrl = getAppEntitiesUrl(DefaultOrg, group, appId);
    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            credentials: 'omit',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch apps for app ${appId}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var entitiesAPIData = await response.json();
    return entitiesAPIData;
};

// FetchAppAssocsData fetches all app associations async
export async function FetchAppAssocsData(group, appId) {
    const dUrl = getAppAssocsUrl(DefaultOrg, group, appId);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            credentials: 'omit',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch apps associations for ${appId}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var assocsAPIData = await response.json();
    return assocsAPIData;
};

// EvalApp traverse an app entirely
export async function EvalApp(group, appId, schedule, from, attributes) {
    const dUrl = getAppEvalUrl(DefaultOrg, group, appId);
    var evalObj = {}

    var response = await fetch(dUrl, {
        method: 'POST',
        credentials: 'omit',
        mode: 'cors',
        headers: GetDefaultHeaders(),
        agent: GetDefaultHttpAgent(),
        body: JSON.stringify(evalObj)
    })

    var evalApiData = await response.json();
    return evalApiData;
}

// CreateEntityActions creates entity actions async
export async function CreateEntityActions(group, appId, entityId, actions) {
}

export async function DeleteEntityActions(group, appId, entityId) {
}

// FetchEntityActions fetches entities actions async
export async function FetchEntityActions(group, appId, entityId) {
}

// CreateAppEntitiesData creates one or more app entities async
export async function CreateAppEntitiesData(group, appId, entities) {
}

// UpdateAppEntityData updates a specific app entity async
export async function UpdateAppEntityData(group, appId, entityId, newEntity) {
}

// DeleteAppEntityData deletes a specific app entity async
export async function DeleteAppEntityData(group, appId, entityId) {
}

// CreateAppAssocsData creates a specific app assoc async
export async function CreateAppAssocsData(group, appId, assocs) {
}

// UpdateAppAssocData updates a specific app association async
export async function UpdateAppAssocData(group, appId, assocId, newAssoc) {
}

// DeleteAppAssocData deletes a specific app association async
export async function DeleteAppAssocData(group, appId, assocId) {
}

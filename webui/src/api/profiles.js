import { useState, useEffect } from 'react';
import { GetDefaultOrg, BackendServer, GetDefaultHttpAgent, GetDefaultHeaders, GetDeleteStatusFromJSON } from "./common";
const util = require('util');

const DefaultOrg = GetDefaultOrg();

// URL constants
const profilesUrl = "https://%s/v1/org/%s/group/%s/behavioral",
    profileUrl = "https://%s/v1/org/%s/group/%s/behavioral/%s",
    profileIncidentUrl = "https://%s/v1/org/%s/group/%s/behavioral/%s/category/%s",
    postureUrl = "https://%s/v1/risk",
    statsUrl = "https://%s/v1/org/%s/group/%s/behavioral/%s/stats/%s",
    remUrl = "https://%s/v1/org/%s/group/%s/behavioral/%s/remediation/%s",
    profileExportUrl = "https://%s/v1/org/%s/group/%s/behavioral/%s/export";

// get profiles URL
export function getProfilesUrl(org, group) {
    return util.format(profilesUrl, BackendServer, org, group);
}

// get profile URL
export function getProfileUrl(org, group, sid) {
    return util.format(profileUrl, BackendServer, org, group, sid);
}

// get profile incident URL
export function getProfileIncidentUrl(org, group, pid, sid) {
    return util.format(profileIncidentUrl, BackendServer, org, group, pid, sid);
}

export function getPostureUrl(org, group, aid) {
    return util.format(postureUrl, BackendServer);
}

export function getProfileStatsUrl(org, group, pid, stats) {
    return util.format(statsUrl, BackendServer, org, group, pid, stats);
}

export function getRemediationUrl(org, group, pid, rem) {
    return util.format(remUrl, BackendServer, org, group, pid, rem);
}

export function getProfileExportUrl(org, group, pid) {
    return util.format(profileExportUrl, BackendServer, org, group, pid);
}

// GetProfileDataFromJson obtains a list of security profile from given JSON
export function GetProfileDataFromJson(data) {
    var profiles = new Map(),
        jsonData = JSON.parse(data),
        profilesArr = jsonData.behavioral;

    try {
        profilesArr.forEach(d => {
            profiles.set(d.id, {
                id: d.id,
                description: d.description,
                envs: d.envs,
                since: d.since,
                apps: d.apps,
                options: d.options
            });
        });
    } catch (error) {
        console.log(error);
    }
    return Object.fromEntries(profiles);
}

// GetProfilesData obtains a list via API call
export function GetProfilesData(group) {
    const [profilesApiData, setProfileDataFromApi] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    // TBD yet to put in use
    GetDefaultHeaders();

    useEffect(() => {
        const dUrl = getProfilesUrl(DefaultOrg, group);
        const fetchData = () => {
            fetch(dUrl, {
                method: 'GET',
                credentials: 'omit',
                mode: 'cors',
                headers: GetDefaultHeaders(),
                agent: GetDefaultHttpAgent()
            })
                .then(response => {
                    if (response.ok) {
                        return response.text();
                    }
                    throw response;
                })
                .then((data) => {
                    setIsLoading(false);
                    setProfileDataFromApi(data);
                })
                .catch((error) => {
                    setIsLoading(false);
                    setIsError(true);
                });
        };
        fetchData();
    }, [group]);
    if (isLoading) {
        return [true, "Loading...", []];
    }
    if (isError) {
        return [true, "Error fetching data..", []];
    }
    return GetProfileDataFromJson(profilesApiData);
};

// FetchProfilesData fetches all security profiles async for {org, group}
export async function FetchProfilesData(group) {
    const dUrl = getProfilesUrl(DefaultOrg, group);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch profiles for ${DefaultOrg}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var profilesApiData = await response.text();
    return GetProfileDataFromJson(profilesApiData);
};

// FetchProfileData fetches a single profile object async
export async function FetchProfileData(group, profileId) {
    const dUrl = getProfileUrl(DefaultOrg, group, profileId);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch profile for ${DefaultOrg}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var profilesApiData = await response.json();
    return profilesApiData;
};

// FetchSecurityIncidents fetches security incidents for a given profile
export async function FetchSecurityIncidents(group, profileId, incidentType) {
    const dUrl = getProfileIncidentUrl(DefaultOrg, group, profileId, incidentType);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch security incident profile ${dUrl}. Error ${err}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var apiData = await response.json();
    return apiData;
};

// DeleteProfileData deletes a specific profile async
export async function DeleteProfileData(group, profileId) {
    const dUrl = getProfileUrl(DefaultOrg, group, profileId);

    var response = await fetch(dUrl, {
        method: 'DELETE',
        credentials: 'omit',
        mode: 'cors',
        headers: GetDefaultHeaders(),
        agent: GetDefaultHttpAgent()
    });

    var deleteResp = await response.text();
    return GetDeleteStatusFromJSON(deleteResp);
};

// CreateProfileData creates a specific profile async
export async function CreateProfileData(group, profileId, description, envs, apps, region,
    autoDiscovery, k8sClusterApi, k8sClusterApiKey, autoDiscoverService) {
    const dUrl = getProfilesUrl(DefaultOrg, group);
    var proObj = {
        behavioral: {
            id: profileId,
            description: description,
            envs: envs, // array of string
            apps: apps, // array of string
            region: region,
            autodiscovery: autoDiscovery,
            k8sapiserver: k8sClusterApi,
            k8saccesstoken: k8sClusterApiKey,
            discoveryservices: autoDiscoverService,
        }
    }

    var response = await fetch(dUrl, {
        method: 'POST',
        credentials: 'omit',
        mode: 'cors',
        headers: GetDefaultHeaders(),
        agent: GetDefaultHttpAgent(),
        body: JSON.stringify(proObj)
    });

    var postResp = await response.json();
    return postResp;
};

// FetchProfilePosture fetches security posture for a given profile
export async function FetchProfilePosture(group, profileId, postureType) {
    const dUrl = getPostureUrl(DefaultOrg, group, profileId);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch security posture for profile ${dUrl}. Error ${err}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var apiData = await response.json();
    return apiData;
};

// FetchProfileStats fetches security stats for a given profile
export async function FetchProfileStats(group, profileId, statsStr) {
    const dUrl = getProfileStatsUrl(DefaultOrg, group, profileId, statsStr);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch security stats for profile ${dUrl}. Error ${err}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var apiData = await response.json();
    return apiData;
};

// FetchProfileRemediation fetches security remediation for a given profile
export async function FetchProfileRemediation(group, profileId, remStr) {
    const dUrl = getRemediationUrl(DefaultOrg, group, profileId, remStr);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch security remediation for profile ${dUrl}. Error ${err}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var apiData = await response.json();
    return apiData;
};

const BEHAVIORAL_PROFILE_SESSION = "behavioralProfile";

// extract {group, profile} from sessionStorage behavioral profile session
export function GetProfileDetails() {
    const profileStr = sessionStorage.getItem(BEHAVIORAL_PROFILE_SESSION);
    if (profileStr === undefined || profileStr === null || profileStr === "") {
        return ["", ""];
    }
    const parts = profileStr.split("/");
    var group = parts[parts.indexOf("group") + 1];
    var profileId = parts[parts.length - 1];
    return [group, profileId];
}

// FetchExportProfile fetches profile export async
export async function FetchExportProfile(group, profileId) {
    const dUrl = getProfileExportUrl(DefaultOrg, group, profileId);

    try {
        var response = await fetch(dUrl, {
            method: 'GET',
            mode: 'cors',
            headers: GetDefaultHeaders(),
            agent: GetDefaultHttpAgent()
        });
    } catch (err) {
        var errStr = `unable to fetch profile for ${DefaultOrg}`;
        window.open(`/error?msg=${errStr}`, "_self");
        return null;
    }

    var profilesApiData = await response.text();
    return profilesApiData;
};

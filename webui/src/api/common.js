import uuid from 'react-uuid';
require('dotenv').config();

// environment variables
export const BackendServer = process.env.REACT_APP_SERVER || "127.0.0.1:7778";
export const DefaultGroup = process.env.REACT_APP_DEFAULT_GROUP || 'default';
export const IsPrivateTenant = (process.env.REACT_APP_IS_PRIVATE_TENANT !== undefined &&
    process.env.REACT_APP_IS_PRIVATE_TENANT === 'true') || false;

var DefaultOrg = process.env.REACT_APP_MY_ORG || 'noorg';

// SetDefaultOrg sets the default org
export function SetDefaultOrg(org) {
    DefaultOrg = org;
    console.info("setting default tenant to ", DefaultOrg, ", IsPrivate: ", IsPrivateTenant);
}

// GetDefaultOrg gets the default org
export function GetDefaultOrg() {
    // if private tenant, return origianl tenant
    if (IsPrivateTenant) {
        return DefaultOrg;
    }
    return sessionStorage.getItem('tenant');
}

// GetOrgFeatures obtains org features
export function GetOrgFeatures(org) {
    return sessionStorage.getItem('zf_features');
}

// SetOrgFeatures obtains org features
export function SetOrgFeatures(org, features) {
    sessionStorage.setItem('zf_features', Array.from(features));
    console.info("setting tenant features to ", features.join(','));
}

// is secret feature enabled on the org
export function IsFeatureEnabledSecret() {
    var f = GetOrgFeatures();
    console.info("_OrgFeatures in secret: ", f);
    return f.includes("secret");
}

// is cert feature enabled on the org
export function IsFeatureEnabledCert() {
    var f = GetOrgFeatures();
    console.info("_OrgFeatures in cert: ", f);
    return f.includes("cert");
}

// GetLoginUser gets the user currently logged in
export function GetLoginUser() {
    return sessionStorage.getItem('user');
}

// ObjectToMap converts a given object and returns a map
export function ObjectToMap(obj) {
    const keys = Object.keys(obj);
    const map = new Map();
    for (let i = 0; i < keys.length; i++) {
        map.set(keys[i], obj[keys[i]]);
    };
    return map;
};

// GetDefaultHeaders obtains default HTTP request headers
export function GetDefaultHeaders() {
    require('cors');
    return new Headers({
    });
}

// GetDefaultLoginHeaders obtains default HTTP login request headers
export function GetDefaultLoginHeaders() {
    require('cors');
    return new Headers({
    });
}

// GetDefaultHttpAgent obtains default HTTP agent
export function GetDefaultHttpAgent() {
    const https = require('https-browserify'); // Use https-browserify for browser compatibility
    return new https.Agent({
        rejectUnauthorized: false
    });
}

// GetDeleteStatusFromJSON obtains delete status from given JSON
export function GetDeleteStatusFromJSON(data) {
    var status = 'failed';

    try {
        var jsonData = JSON.parse(data);
        status = jsonData.Status;
    } catch (error) {
    }
    return status;
};

// IsSame returns true if two maps are same
export function IsSameMap(m1, m2) {
    if (m1.length !== m2.length) {
        return false;
    }

    var val2;
    for (var [key, val] of m1) {
        val2 = m2.get(key);
        if (val2 !== val || (val2 === undefined && !m2.has(key))) {
            return false;
        }
    }
    return true;
}

// GetTimeStrFromTimestamp returns readable date/time from unix timestamp
export function GetTimeStrFromTimestamp(unixTs) {
    var tm = new Date(unixTs * 1000),
        date = tm.getDate(),
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        month = months[tm.getMonth()],
        year = tm.getFullYear(),
        hour = ("0" + tm.getHours()).slice(-2),
        min = ("0" + tm.getMinutes()).slice(-2),
        sec = ("0" + tm.getSeconds()).slice(-2);
    return date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
}

export function JsonLookup(obj, key) {
    if (typeof (obj) != 'object') {
        return null;
    }
    var result = null;
    if (obj.hasOwnProperty(key)) {
        return obj[key];
    } else {
        for (var o in obj) {
            result = JsonLookup(obj[o], key);
            if (result == null) {
                continue;
            }
            break;
        }
    }
    return result;
}

export function Uuid() {
    return uuid();
}

// Now returns time in seconds since epoch
export function Now() {
    return Math.floor(Date.now() / 1000);
}

export function EncodeBase64(data) {
    if (data === undefined) {
        return '';
    }
    var buf = Buffer.from(data, 'utf-8');
    return buf.toString('base64');
}

export function DecodeBase64(b64Data) {
    if (b64Data === undefined) {
        return '';
    }
    var buf = Buffer.from(b64Data, 'base64');
    return buf.toString('utf-8');
}

export function FetchWithTimeout(url, options = {}, timeout = 5000) {
    // promise that rejects in timeout
    const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, timeout);

        // clear if the fetch completes in time
        options.signal.addEventListener('abort', () => clearTimeout(timer));
    });

    const fetchPromise = fetch(url, options);
    return Promise.race([fetchPromise, timeoutPromise]);
}

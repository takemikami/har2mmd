const nameValueMap = (nameValueList : Array<{ [key: string]: string; }>) => {
    var nvmap: { [key: string]: string; } = {}
    for (const e of nameValueList) {
        nvmap[e['name'].toLowerCase()] = e['value']
    }
    return nvmap
}
const cookieMap = (cookieStr : string) => {
    var cmap: { [key: string]: string; } = {}
    if(!cookieStr)
        return cmap
    for(const c of cookieStr.split(";")) {
        const kv = c.replace(/^\s+|\s+$/g, '').split("=")
        cmap[kv[0]] = kv.slice(1).join("=")
    }
    return cmap
}
const kvList = (kvmap: { [key: string]: any; }) => {
    var rtn = []
    for (const k in kvmap) {
        rtn.push(k.slice(0, 25) + "=" + kvmap[k].slice(0, 25))
    }
    return rtn
}

const har2entries = (har_body: string) => {
    var entries : Array<{ [key: string]: any; }> = []
    const har_json = eval("(" + har_body + ")");
    for (const e of har_json["log"]["entries"]) {
        const result = e["request"]["url"].match(/[a-z]*:\/\/([^/]*)([^?]*)/);
        const host = result[1]
        const path = result[2]
        var setCookies : { [key: string]: string; } = {}
        for (const c of e["response"]["headers"]) {
            if (c['name'].toLowerCase() == "set-cookie" ) {
                const kv = c['value'].split(";")[0].split("=")
                setCookies[kv[0]] = kv.slice(1).join('=')
            }
        }
        const entry = {
            "datetime": e['startedDateTime'],
            "host": host,
            "method": e["request"]["method"],
            "path": path,
            "query_params": nameValueMap(e["request"]["queryString"]),
            "status": e["response"]["status"],
            "content_mime": e["response"]["content"]["mimeType"],
            "content_size": e["response"]["content"]["size"],
            "send_cookies": cookieMap(nameValueMap(e["request"]["headers"])['cookie']),
            "set_cookies": setCookies,
        }
        entries.push(entry)
    }
    return entries
}

const entries2hosts = (entries: Array<{ [key: string]: any; }>) => {
    var hosts : { [key: string]: string; } = {}
    var hostList : Array<string> = []
    for(const e of entries) {
        if (!hosts[e['host']]) {
            hosts[e['host']] = e['host'].replaceAll('.', '_').replaceAll('-', '_')
            hostList.push(e['host'])
        }
    }
    return hostList
}

export const har2hosts = (har_body: string) => {
    return entries2hosts(har2entries(har_body))
}

export const har2mmd = (har_body: string, target_hosts: Array<string>, notes : Array<string>, config: { [key: string]: any; }) => {
    const entries = har2entries(har_body)
    var hosts : { [key: string]: string; } = {}
    var hostList : Array<string> = []
    for(const e of entries) {
        if(!target_hosts.includes(e['host'])) {
            continue;
        }
        if (!hosts[e['host']]) {
            hosts[e['host']] = e['host'].replaceAll('.', '_').replaceAll('-', '_')
            hostList.push(e['host'])
        }
    }
    var mmd : Array<string> = []
    mmd.push("sequenceDiagram")
    mmd.push("actor visitor as visitor")
    for(const h of hostList.sort()) {
        mmd.push("participant " + hosts[h] + " as " + h)
    }
    var viewEntries: Array<{ [key: string]: any; }> = []
    if (config["compact"]) {
        var crr = null
        for(const e of entries) {
            if (!target_hosts.includes(e['host'])) {
                continue;
            }
            if (crr && crr['host'] == e['host'] && crr['content_mime'] == e['content_mime'] && crr['status'] == e['status'] && e['content_mime'].startsWith("image/")) {
                crr['repeat'] ++;
            } else {
                viewEntries.push(e)
                e['repeat'] = 1
                crr = e
            }
        }
    } else {
        viewEntries = entries
    }
    for(const e of viewEntries) {
        if(!target_hosts.includes(e['host'])) {
            continue;
        }
        if (e['repeat'] && e['repeat'] > 1) {
            mmd.push("  loop " + e['repeat'] + " times");
            mmd.push("    visitor ->>+ " + hosts[e['host']] + ": " + e['path'].slice(0, 50) + " etc")
            mmd.push("    " + hosts[e['host']] + " -->>- visitor: " + e['status'] + " - " + e['content_mime'])
            mmd.push("  end");
        } else {
            mmd.push("  visitor ->>+ " + hosts[e['host']] + ": " + e['path'].slice(0, 50))
            if (notes.includes("params") && Object.keys(e['query_params']).length > 0) {
                if(notes.includes("value")) {
                    mmd.push("   Note right of visitor: [params]<br/>" + kvList(e['query_params']).join("<br/>"))
                } else {
                    mmd.push("   Note right of visitor: [params]<br/>" + Object.keys(e['query_params']).join("<br/>"))
                }
            }
            if (notes.includes("send_cookies") && Object.keys(e['send_cookies']).length > 0) {
                if(notes.includes("value")) {
                    mmd.push("   Note right of visitor: [send-cookie]<br/>" + kvList(e['send_cookies']).join("<br/>"))
                } else {
                    mmd.push("   Note right of visitor: [send-cookie]<br/>" + Object.keys(e['send_cookies']).join("<br/>"))
                }
            }
            mmd.push("  " + hosts[e['host']] + " -->>- visitor: " + e['status'] + " - " + e['content_mime'])
            if (notes.includes("set_cookies") && Object.keys(e['set_cookies']).length > 0) {
                if(notes.includes("value")) {
                    mmd.push("   Note left of " + hosts[e['host']] + ": [set-cookie]<br/>" + kvList(e['set_cookies']).join("<br/>"))
                } else {
                    mmd.push("   Note left of " + hosts[e['host']] + ": [set-cookie]<br/>" + Object.keys(e['set_cookies']).join("<br/>"))
                }
            }
        }
    }
    return mmd.join("\n")
}

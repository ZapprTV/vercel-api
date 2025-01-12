export const config = {
    runtime: "edge",
};

export async function GET(request, env, ctx) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type"
    };
    const paramsToObject = (entries) => {
        const result = {};
        for (const [key, value] of entries) {
            result[key] = value;
        };
        return result;
    };
    
    // https://uibakery.io/regex-library/url
    const urlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
    const supportedURLRegexes = {
        rai: /^https?:\/\/mediapolis.rai.it\/relinker\/relinkerServlet.htm\?cont=[0-9]{1,}$/g,
        babylon: /^https?:\/\/(?:www\.)?[a-zA-Z0-9]{1,}\.[a-z]{2,}\/video\/viewlivestreaming\?rel=[a-zA-Z0-9]+&cntr=0$/g
    };

    const cloudflareURLRegexes = {
        dailymotion: /^https?:\/\/(?:www\.)?dailymotion\.com\/video\/[a-zA-Z0-9]+$/g,
        youtube: /^https?:\/\/(?:www\.)?youtube\.com\/channel\/UC[a-zA-Z0-9-_? ]+$/g
    };

    const requestURL = new URL(request.url);
    const specifiedURL = decodeURIComponent(requestURL.search.slice(1));

    let testResults = { matched: false, matchedRegex: "" };
    let cloudflareTestResults = { matched: false, matchedRegex: "" };
    let requestStatus;
    let response = "";
    let errorJSON = "";
    let errorStatus = 0;

    const testURL = (url) => {
        if (urlRegex.test(url)) {
            for (const regex in supportedURLRegexes) {
                if (supportedURLRegexes[regex].test(url)) {
                    testResults = { matched: true, matchedRegex: regex };
                    break;
                };
            };
        };
    };

    const testURLforCloudflare = (url) => {
        if (urlRegex.test(url)) {
            for (const regex in cloudflareURLRegexes) {
                if (cloudflareURLRegexes[regex].test(url)) {
                    cloudflareTestResults = { matched: true, matchedRegex: regex };
                    break;
                };
            };
        };
    };

    const returnErrorHeaders = (errorStatus) => {
        return {
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            status: errorStatus
        };
    };

    if (request.method === "GET" && requestURL.pathname === "/api") {
        if (requestURL.search.length > 0) {
            testURL(specifiedURL);
            testURLforCloudflare(specifiedURL);
            if (cloudflareTestResults.matched) {
                return new Response(JSON.stringify({
                    error: "Stai usando l'API Vercel, ma l'URL specificato richiede l'uso dell'API Cloudflare. Leggi di più su https://github.com/ZapprTV/backend#readme.",
                    info: specifiedURL
                }), returnErrorHeaders(400));
            } else if (testResults.matched) {
                switch(testResults.matchedRegex) {
                    case "rai":
                        await fetch(`${specifiedURL}&output=62`)
                            .then(response => response.json())
                            .then(json => {
                                requestStatus = "redirect";
                                response = json.video[0];
                            })
                            .catch(err => {
                                requestStatus = false;
                                errorJSON = JSON.stringify({
                                    error: "Impossibile recuperare l'URL della stream.",
                                    info: specifiedURL
                                });
                                errorStatus = 500;
                            });
                        break;

                    case "babylon":
                        const { parseHTML } = await import("linkedom");
                        await fetch(specifiedURL)
                            .then(response => response.text())
                            .then(html => {
                                requestStatus = "redirect";
                                response = parseHTML(html).document.querySelector("source").src;
                            });
                        break;
                };

                if (requestStatus === "redirect") {
                    return new Response(null, {
                        status: 302,
                        headers: {
                            ...headers,
                            "location": response
                        }
                    });
                } else if (requestStatus === "hls") {
                    return new Response(response, {
                        status: 200,
                        headers: {
                            ...headers,
                            "Content-Type": "application/vnd.apple.mpegurl"
                        }
                    });
                } else {
                    return new Response(errorJSON, returnErrorHeaders(errorStatus));
                };
            } else {
                return new Response(JSON.stringify({
                    error: "L'URL specificato non è valido, non è nel formato corretto oppure non è supportato dall'API di Zappr. Per vedere la lista di URL compatibili visita https://github.com/ZapprTV/backend#readme.",
                    info: specifiedURL
                }), returnErrorHeaders(400));
            }
        };
    } else if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: headers
        });
    } else {
        return new Response(JSON.stringify({
            error: "Metodo o endpoint invalido.",
            info: request.url
        }), returnErrorHeaders(405));
    }
    
}
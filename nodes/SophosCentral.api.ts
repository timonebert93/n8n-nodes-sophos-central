import axios, { AxiosRequestConfig } from 'axios';
import { getAccessToken } from '../utils/tokenManager';


const API_BASE = 'https://api.central.sophos.com';


export async function sophosRequest(
clientId: string,
clientSecret: string,
path: string,
method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
data?: any,
params?: any,
scope = 'token',
) {
const token = await getAccessToken(clientId, clientSecret, scope);


const cfg: AxiosRequestConfig = {
method,
url: `${API_BASE}${path}`,
headers: {
Authorization: `Bearer ${token}`,
'Content-Type': 'application/json',
'Accept': 'application/json',
},
data,
params,
timeout: 20000,
};


const resp = await axios.request(cfg);
return resp.data;
}


export async function sophosPaginatedGet(
clientId: string,
clientSecret: string,
path: string,
params?: any,
pageField = 'next',
) {
// Generic paginator: expects response with `items` array and `next` link / token in the response
let results: any[] = [];
let nextUrl: string | undefined;


let resp = await sophosRequest(clientId, clientSecret, path, 'GET', undefined, params);


if (Array.isArray(resp.items)) {
results = results.concat(resp.items);
nextUrl = resp.next;
} else if (Array.isArray(resp.data)) {
// fallback for APIs returning data in `data`
results = results.concat(resp.data);
nextUrl = resp.next;
} else {
// If structure unexpected, return raw
return resp;
}


while (nextUrl) {
// nextUrl could be full URL; if so, strip base
let pathToUse = nextUrl.startsWith('http') ? new URL(nextUrl).pathname + new URL(nextUrl).search : nextUrl;
resp = await sophosRequest(clientId, clientSecret, pathToUse, 'GET');
if (Array.isArray(resp.items)) {
results = results.concat(resp.items);
nextUrl = resp.next;
} else if (Array.isArray(resp.data)) {
results = results.concat(resp.data);
nextUrl = resp.next;
} else {
break;
}
}


return { items: results };
}
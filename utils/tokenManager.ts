import axios from 'axios';


type TokenCache = {
accessToken: string;
expiresAt: number; // unix ms
};


const cache: Record<string, TokenCache> = {};


export async function getAccessToken(clientId: string, clientSecret: string, scope = 'token') {
const cacheKey = `${clientId}:${scope}`;
const now = Date.now();


const entry = cache[cacheKey];
if (entry && entry.expiresAt - 5000 > now) {
return entry.accessToken;
}


const params = new URLSearchParams();
params.append('grant_type', 'client_credentials');
params.append('client_id', clientId);
params.append('client_secret', clientSecret);
params.append('scope', scope);


const resp = await axios.post('https://id.sophos.com/api/v2/oauth2/token', params.toString(), {
headers: {
'Content-Type': 'application/x-www-form-urlencoded',
},
timeout: 15000,
});


const token = resp.data.access_token as string;
const expiresIn = resp.data.expires_in as number || 3600;


cache[cacheKey] = {
accessToken: token,
expiresAt: Date.now() + (expiresIn * 1000),
};


return token;
}
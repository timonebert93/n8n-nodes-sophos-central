import { ICredentialType, INodeProperties } from 'n8n-workflow';


export class SophosCentralApi implements ICredentialType {
name = 'sophosCentralApi';
displayName = 'Sophos Central API';
documentationUrl = 'https://developer.sophos.com';


properties: INodeProperties[] = [
{
displayName: 'Client ID',
name: 'clientId',
type: 'string',
default: '',
},
{
displayName: 'Client Secret',
name: 'clientSecret',
type: 'string',
typeOptions: { password: true },
default: '',
},
{
displayName: 'OAuth Scope',
name: 'scope',
type: 'string',
default: 'token',
description: 'Optional: scope for token request (default: token)'
}
];
}
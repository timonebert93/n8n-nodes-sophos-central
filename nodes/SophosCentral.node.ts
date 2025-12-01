import {
  IExecuteFunctions,
} from 'n8n-core';

import {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  NodeOperationError,
} from 'n8n-workflow';

import { sophosRequest, sophosPaginatedGet } from './SophosCentral.api';

export class SophosCentral implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sophos Central',
    name: 'sophosCentral',
    group: ['output'],
    version: 1,
    description: 'Interact with Sophos Central',
    defaults: {
      name: 'Sophos Central',
      color: '#0066cc',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'sophosCentralApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'Tenant', value: 'tenant' },
          { name: 'Endpoint', value: 'endpoint' },
          { name: 'Alert', value: 'alert' },
          { name: 'Firewall', value: 'firewall' },
          { name: 'Security', value: 'security' },
        ],
        default: 'endpoint',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          // Tenant
          { name: 'List Tenants', value: 'listTenants', description: 'A - Tenant list' },
          { name: 'Tenant Details', value: 'tenantDetails' },
          // Endpoint
          { name: 'List Endpoints', value: 'listEndpoints' },
          { name: 'Get Endpoint', value: 'getEndpoint' },
          { name: 'Find Endpoint', value: 'findEndpoint' },
          { name: 'Isolate Endpoint', value: 'isolateEndpoint' },
          { name: 'Unisolate Endpoint', value: 'unisolateEndpoint' },
          // Alerts
          { name: 'List Alerts', value: 'listAlerts' },
          { name: 'Acknowledge Alert', value: 'ackAlert' },
          // Firewall
          { name: 'List Firewall Alerts', value: 'listFwAlerts' },
          { name: 'Firewall Status', value: 'fwStatus' },
          // Security
          { name: 'Tamper Status', value: 'tamperStatus' },
          { name: 'Reset Tamper Password', value: 'resetTamper' },
        ],
        default: 'listEndpoints',
      },
      // Common params
      {
        displayName: 'Tenant ID',
        name: 'tenantId',
        type: 'string',
        default: '',
        placeholder: 'Optional: specify tenant id',
      },
      {
        displayName: 'Endpoint ID / Hostname',
        name: 'endpointId',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Filter (JSON)',
        name: 'filter',
        type: 'string',
        default: '',
        description: 'Optional JSON object for filtering (e.g. {"hostname":"srv01"})',
      },
      {
        displayName: 'Limit (pagination)',
        name: 'limit',
        type: 'number',
        default: 100,
      },
      {
        displayName: 'Debug',
        name: 'debug',
        type: 'boolean',
        default: false,
        description: 'Enable verbose debug output',
      }
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const creds = await this.getCredentials('sophosCentralApi');
    if (!creds) {
      throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
    }
    const clientId = (creds as any).clientId as string;
    const clientSecret = (creds as any).clientSecret as string;
    const scope = (creds as any).scope || 'token';

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      const endpointId = this.getNodeParameter('endpointId', i, '') as string;
      const filter = this.getNodeParameter('filter', i, '') as string;
      const limit = this.getNodeParameter('limit', i, 100) as number;
      const debug = this.getNodeParameter('debug', i, false) as boolean;

      try {
        // Routing by resource + operation
        if (resource === 'tenant') {
          if (operation === 'listTenants') {
            const resp = await sophosRequest(clientId, clientSecret, '/tenant/v1/tenants', 'GET', undefined, { limit });
            returnData.push({ json: resp });
          } else if (operation === 'tenantDetails') {
            if (!tenantId) throw new NodeOperationError(this.getNode(), 'tenantId required');
            const resp = await sophosRequest(clientId, clientSecret, `/tenant/v1/tenants/${tenantId}`);
            returnData.push({ json: resp });
          }
        } else if (resource === 'endpoint') {
          if (operation === 'listEndpoints') {
            const resp = await sophosPaginatedGet(clientId, clientSecret, '/endpoint/v1/endpoints', { limit });
            returnData.push({ json: resp });
          } else if (operation === 'getEndpoint') {
            if (!endpointId) throw new NodeOperationError(this.getNode(), 'endpointId required');
            const resp = await sophosRequest(clientId, clientSecret, `/endpoint/v1/endpoints/${endpointId}`);
            returnData.push({ json: resp });
          } else if (operation === 'findEndpoint') {
            if (!filter) throw new NodeOperationError(this.getNode(), 'filter required');
            let parsed; try { parsed = JSON.parse(filter); } catch (e) { throw new NodeOperationError(this.getNode(), 'filter must be valid JSON'); }
            // simplistic find: call list and filter locally
            const list = await sophosPaginatedGet(clientId, clientSecret, '/endpoint/v1/endpoints', { limit });
            const found = (list.items || []).filter((it: any) => {
              return Object.keys(parsed).every(k => ('' + (it[k] ?? '')).toLowerCase().includes(('' + parsed[k]).toLowerCase()));
            });
            returnData.push({ json: { results: found } });
          } else if (operation === 'isolateEndpoint' || operation === 'unisolateEndpoint') {
            if (!endpointId) throw new NodeOperationError(this.getNode(), 'endpointId required');
            const action = operation === 'isolateEndpoint' ? 'isolate' : 'unisolate';
            const resp = await sophosRequest(clientId, clientSecret, `/endpoint/v1/endpoints/${endpointId}/${action}`, 'POST');
            returnData.push({ json: resp });
          }
        } else if (resource === 'alert') {
          if (operation === 'listAlerts') {
            const resp = await sophosPaginatedGet(clientId, clientSecret, '/alert/v1/alerts', { limit });
            returnData.push({ json: resp });
          } else if (operation === 'ackAlert') {
            const alertId = this.getNodeParameter('endpointId', i, '') as string; // reuse field
            if (!alertId) throw new NodeOperationError(this.getNode(), 'alert id required');
            const resp = await sophosRequest(clientId, clientSecret, `/alert/v1/alerts/${alertId}/acknowledge`, 'POST');
            returnData.push({ json: resp });
          }
        } else if (resource === 'firewall') {
          if (operation === 'listFwAlerts') {
            const resp = await sophosPaginatedGet(clientId, clientSecret, '/firewall/v1/alerts', { limit });
            returnData.push({ json: resp });
          } else if (operation === 'fwStatus') {
            const resp = await sophosRequest(clientId, clientSecret, '/firewall/v1/status');
            returnData.push({ json: resp });
          }
        } else if (resource === 'security') {
          if (operation === 'tamperStatus') {
            const resp = await sophosRequest(clientId, clientSecret, '/security/v1/tamper');
            returnData.push({ json: resp });
          } else if (operation === 'resetTamper') {
            const body = { /* depends on API */ };
            const resp = await sophosRequest(clientId, clientSecret, '/security/v1/tamper/reset', 'POST', body);
            returnData.push({ json: resp });
          }
        }

        if (debug) {
          returnData.push({ json: { debug: 'operation complete', resource, operation } });
        }

      } catch (err: any) {
        // Fehlerbehandlung: gib n8n ein sinnvolles Objekt zurück
        const message = err?.response?.data ?? err?.message ?? String(err);
        returnData.push({ json: { error: message } });
      }
    }

    return this.prepareOutputData(returnData);
  }
}
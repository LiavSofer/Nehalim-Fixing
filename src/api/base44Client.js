import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

let base44Instance = null;

function getBase44Instance() {
  if (!base44Instance) {
    const { appId, token, functionsVersion, appBaseUrl } = appParams;
    base44Instance = createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl
    });
  }
  return base44Instance;
}

export const base44 = {
  get auth() { return getBase44Instance().auth; },
  get entities() { return getBase44Instance().entities; },
  get functions() { return getBase44Instance().functions; },
  get connectors() { return getBase44Instance().connectors; },
  get integrations() { return getBase44Instance().integrations; },
  get analytics() { return getBase44Instance().analytics; },
  get users() { return getBase44Instance().users; },
};
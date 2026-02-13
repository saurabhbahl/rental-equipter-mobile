/**
 * REQUEST ID
 * Generates a unique ID for each API request (mixed from timestamp and nanoid).
 * Used by the axios client as x-request-signature-id so the server can track/log requests.
 * The get-random-values polyfill is required in React Native before using nanoid.
 */
import 'react-native-get-random-values';
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$^&*",119);

export function generateRequestId() {
  let timestamp = Date.now().toString();
  timestamp=timestamp.split("").reverse().join('');
  const id = nanoid();
  const tsChunks = timestamp.match(/.{1,1}/g) || [];
  const idChunks = id.match(/.{1,6}/g) || [];
  const mixed = [];
  for (let i = 0; i < Math.max(tsChunks.length, idChunks.length); i++) {
    if (idChunks[i]) mixed.push(idChunks[i]);
    if (tsChunks[i]) mixed.push(tsChunks[i]);
  }
  return mixed.join("");
}


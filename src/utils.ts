import { connect, keyStores, utils, Account } from "near-api-js";

const { NEAR_NODE_URL, NEAR_WALLET_URL, NEAR_HELPER_URL } = process.env;

const nodeUrl = NEAR_NODE_URL || "https://rpc.testnet.near.org";
const walletUrl = NEAR_WALLET_URL || "https://wallet.testnet.near.org";
const helperUrl = NEAR_HELPER_URL || "https://helper.testnet.near.org";

export async function init() {
  const keyPair = utils.KeyPair.fromString(
    "4oBpsMB1aeeuUEYvVaFGD1fLoRw2EfqVSMHwoYDRp9DEgNoMnK2aS1eBzYxhNZtkVEhJ4AyWUwFrjFo2zSxtZeWC"
  );
  const keyStore = new keyStores.InMemoryKeyStore();
  keyStore.setKey("testnet", "test-relay-rpc.testnet", keyPair);
  const near = await connect({
    networkId: "testnet",
    keyStore,
    nodeUrl,
    walletUrl,
    helperUrl,
  });
  const account = await near.account("test-relay-rpc.testnet");
  return account;
}

function parseJsonFromRawResponse(response: Uint8Array): any {
  return JSON.parse(Buffer.from(response).toString());
}

export function jsonToBuffer(json: any): number[] {
  return Array.from(Buffer.from(JSON.stringify(json), "utf8"));
}

function validateArgs(args: any) {
  const isUint8Array =
    args.byteLength !== undefined && args.byteLength === args.length;
  if (isUint8Array) {
    return true;
  }
  if (Array.isArray(args) || typeof args !== "object") {
    console.error("wrong args");
    return false;
  }
  return true;
}

export async function rawQuery(
  account: Account,
  contractId: string,
  methodName: string,
  args = {},
  { parse = parseJsonFromRawResponse } = {}
) {
  if (validateArgs(args)) {
    const result = (await account.connection.provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: methodName,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    })) as any;
    if (result.logs && result.logs.length > 0) {
      console.log(result.logs);
    }
    const resultExists = result.result && result.result.length > 0;
    if (resultExists) {
      result.result = parse(Buffer.from(result.result));
    }
    return resultExists && result;
  }
}

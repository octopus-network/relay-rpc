import { Account } from "near-api-js";
import { rawQuery, jsonToBuffer } from "./utils";
import _ from "lodash";

const pageSize = 10;

export default async function relayFacts(
  account: Account,
  args: any,
  queries: any
) {
  const contractId = args.account_id;
  const factsResult = await rawQuery(
    account,
    args.account_id,
    "get_facts",
    queries
  );

  const result = factsResult.result as any[];
  // only the last fact can be UpdateValidatorSet
  if (result.length > 0 && result[result.length - 1]["UpdateValidatorSet"]) {
    const validatorSet = result[result.length - 1]["UpdateValidatorSet"];
    const { validators_len, seq_num, set_id } = validatorSet;

    const groupLen = Math.ceil(validators_len / pageSize);
    const requestGroup = new Array(groupLen).fill(1).map(async ($, index) => {
      return await getValidatorHistories(
        account,
        contractId,
        queries.appchain_id,
        seq_num,
        index * pageSize,
        pageSize
      );
    });
    const validatorHistoriesArr = (await Promise.all(requestGroup)) as any[];
    const validatorHistories = _.concat([], ...validatorHistoriesArr);
    const validators = validatorHistories.map((v) => ({
      id: v.id,
      account_id: v.account_id,
      weight: v.weight,
      block_height: v.block_height,
      delegators: [],
    }));
    validators.sort((a: any, b: any) => a.id - b.id);
    const fullDataValidatorSet = {
      seq_num,
      set_id,
      validators,
    };
    result[result.length - 1]["UpdateValidatorSet"] = fullDataValidatorSet;
  }
  factsResult.result = jsonToBuffer(factsResult.result);
  return factsResult;
}

async function getValidatorHistories(
  account: Account,
  contractId: string,
  appchain_id: string,
  seq_num: number,
  start: number,
  limit: number
) {
  const validatorsResult = await rawQuery(
    account,
    contractId,
    "get_validator_histories",
    { appchain_id, seq_num, start, limit }
  );
  return validatorsResult.result;
}

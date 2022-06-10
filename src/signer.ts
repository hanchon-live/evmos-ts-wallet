import fetch from 'node-fetch'
import { TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util'
import { Wallet } from '@ethersproject/wallet'
import {
  arrayify,
  concat,
  splitSignature,
  joinSignature,
} from '@ethersproject/bytes'
import { createTxRaw } from '@tharsis/proto'
import {
  createTxRawEIP712,
  signatureToWeb3Extension,
  Sender,
  TxGenerated,
  createMessageSend,
  Chain,
} from '@tharsis/transactions'

// Chain helpers

export const LOCALNET_CHAIN = {
  chainId: 9000,
  cosmosChainId: 'evmos_9000-1',
}

export const LOCALNET_FEE = {
  amount: '20',
  denom: 'aevmos',
  gas: '200000',
}

export const MAINNET_CHAIN = {
  chainId: 9001,
  cosmosChainId: 'evmos_9001-2',
}

export const MAINNET_FEE = {
  amount: '5000',
  denom: 'aevmos',
  gas: '600000',
}

export const TESTNET_CHAIN = {
  chainId: 9001,
  cosmosChainId: 'evmos_9001-2',
}

export const TESTNET_FEE = {
  amount: '5000',
  denom: 'atevmos',
  gas: '600000',
}

// Get Account
/* eslint-disable camelcase */
interface AccountResponse {
  account: {
    '@type': string
    base_account: {
      address: string
      pub_key: {
        '@type': string
        key: string
      }
      account_number: string
      sequence: string
    }
    code_hash: string
  }
}

export async function getSender(
  wallet: string,
  url: string = 'http://127.0.0.1:1317',
) {
  const addrRequest = await fetch(
    `${url}/cosmos/auth/v1beta1/accounts/${wallet}`,
  )
  const resp = (await addrRequest.json()) as AccountResponse

  return {
    accountAddress: wallet,
    sequence: parseInt(resp.account.base_account.sequence as string, 10),
    accountNumber: parseInt(resp.account.base_account.account_number, 10),
    pubkey: resp.account.base_account.pub_key.key,
  }
}

// Broadcast a transaction in json.stringify format
export async function broadcast(
  transactionBody: string,
  url: string = 'http://127.0.0.1:1317',
) {
  const post = await fetch(`${url}/cosmos/tx/v1beta1/txs`, {
    method: 'post',
    body: transactionBody,
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await post.json()
  return data
}

// Sign transaction using payload method (keplr style)
export async function signTransaction(
  wallet: Wallet,
  tx: TxGenerated,
  broadcastMode: string = 'BROADCAST_MODE_BLOCK',
) {
  const dataToSign = `0x${Buffer.from(
    tx.signDirect.signBytes,
    'base64',
  ).toString('hex')}`

  /* eslint-disable no-underscore-dangle */
  const signatureRaw = wallet._signingKey().signDigest(dataToSign)
  const splitedSignature = splitSignature(signatureRaw)
  const signature = arrayify(concat([splitedSignature.r, splitedSignature.s]))

  const signedTx = createTxRaw(
    tx.signDirect.body.serializeBinary(),
    tx.signDirect.authInfo.serializeBinary(),
    [signature],
  )
  const body = `{ "tx_bytes": [${signedTx.message
    .serializeBinary()
    .toString()}], "mode": "${broadcastMode}" }`

  return body
}

// Sign transaction using eip712 method (metamask style)
export async function singTransactionUsingEIP712(
  wallet: Wallet,
  sender: string,
  tx: TxGenerated,
  chain: Chain = LOCALNET_CHAIN,
  broadcastMode: string = 'BROADCAST_MODE_BLOCK',
) {
  const dataToSign = arrayify(
    TypedDataUtils.eip712Hash(tx.eipToSign as any, SignTypedDataVersion.V4),
  )
  /* eslint-disable no-underscore-dangle */
  const signatureRaw = await wallet._signingKey().signDigest(dataToSign)
  const signature = joinSignature(signatureRaw)

  const extension = signatureToWeb3Extension(
    chain,
    { accountAddress: sender } as Sender,
    signature,
  )
  const signedTx = createTxRawEIP712(
    tx.legacyAmino.body,
    tx.legacyAmino.authInfo,
    extension,
  )

  return `{ "tx_bytes": [${signedTx.message
    .serializeBinary()
    .toString()}], "mode": "${broadcastMode}" }`
}

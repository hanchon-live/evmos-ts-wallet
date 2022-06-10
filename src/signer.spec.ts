import { Wallet } from '@ethersproject/wallet'
import { createMessageSend } from '@tharsis/transactions'
import { ethToEvmos } from '@tharsis/address-converter'
import {
  broadcast,
  getSender,
  LOCALNET_CHAIN,
  LOCALNET_FEE,
  signTransaction,
  singTransactionUsingEIP712,
} from './signer'
// We are doing the test with broadcast block so it's going to take at least 6 seconds per transaction, that's why we need to change the timeout to something bigger
// The block flag is required so the account sequence is updated between tests

jest.setTimeout(60 * 60 * 10000)
// NOTE: this tests requires that the address has founds and has already sent al least 1 transaction
describe('send transactions to the node', () => {
  it('simple send using EIP712', async () => {
    const privateMnemonic =
      'pluck view carry maid bamboo river major where dutch wood certain oval order wise awkward clerk adult summer because number raven coil crunch hat'
    const wallet = Wallet.fromMnemonic(privateMnemonic)
    const evmosAddress = ethToEvmos(wallet.address)

    const sender = await getSender(evmosAddress)
    const txSimple = createMessageSend(
      LOCALNET_CHAIN,
      sender,
      LOCALNET_FEE,
      '',
      {
        destinationAddress: 'evmos1pmk2r32ssqwps42y3c9d4clqlca403yd9wymgr',
        amount: '1',
        denom: 'aevmos',
      },
    )
    const resMM = await singTransactionUsingEIP712(
      wallet,
      evmosAddress,
      txSimple,
    )
    const broadcastRes = await broadcast(resMM)
    expect(broadcastRes.tx_response.code).toBe(0)
  })

  it('simple send using sign payload', async () => {
    const privateMnemonic =
      'pluck view carry maid bamboo river major where dutch wood certain oval order wise awkward clerk adult summer because number raven coil crunch hat'
    const wallet = Wallet.fromMnemonic(privateMnemonic)
    const evmosAddress = ethToEvmos(wallet.address)

    const sender = await getSender(evmosAddress)
    const txSimple = createMessageSend(
      LOCALNET_CHAIN,
      sender,
      LOCALNET_FEE,
      '',
      {
        destinationAddress: 'evmos1pmk2r32ssqwps42y3c9d4clqlca403yd9wymgr',
        amount: '1',
        denom: 'aevmos',
      },
    )

    const resKeplr = await signTransaction(wallet, txSimple)
    const broadcastRes = await broadcast(resKeplr)
    expect(broadcastRes.tx_response.code).toBe(0)
  })
})

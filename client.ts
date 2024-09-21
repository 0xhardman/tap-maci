import { http, createPublicClient, createWalletClient } from 'viem'
import { holesky } from 'viem/chains'

export const publicClient = createPublicClient({
    chain: holesky,
    transport: http(),
})

export const walletClient = createWalletClient({
    chain: holesky,
    transport: http(),
    account: "0xe3Fe1c65967f83650D2B6E72525848f720f32d5d"
})
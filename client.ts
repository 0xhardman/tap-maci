import { http, createPublicClient, createWalletClient } from 'viem'
import { sepolia } from 'viem/chains'

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
})

export const walletClient = createWalletClient({
    chain: sepolia,
    transport: http(),
    account: "0xe3Fe1c65967f83650D2B6E72525848f720f32d5d"
})
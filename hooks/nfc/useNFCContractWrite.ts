import { useState } from "react";
import { useTargetNetwork } from "../scaffold-eth/useTargetNetwork";
import { Abi, ExtractAbiFunctionNames } from "abitype";
import { sepolia, useContractWrite, useNetwork } from "wagmi";
import { recoverAddress } from 'viem'
import { useDeployedContractInfo, useTransactor } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { ContractAbi, ContractName, UseScaffoldWriteConfig } from "~~/utils/scaffold-eth/contract";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web.js";
import { createWalletClient, custom, encodeFunctionData, Hash, keccak256, serializeTransaction } from "viem";
import { hexEncodedString } from "~~/utils/nfc";
import rlp from 'rlp';
import { useAuthContext } from "~~/contexts/AuthContext";
import { useNFCAuthContext } from "~~/contexts/AuthNFCContext";
import { useAccount } from "./useAccount";
import { useAccount as useWagmiAccount } from "wagmi";
import { publicClient, walletClient } from "~~/client";

type UpdatedArgs = Parameters<ReturnType<typeof useContractWrite < Abi, string, undefined >>["writeAsync"]>[0];

/**
 * Wrapper around wagmi's useContractWrite hook which automatically loads (by name) the contract ABI and address from
 * the contracts present in deployedContracts.ts & externalContracts.ts corresponding to targetNetworks configured in scaffold.config.ts
 * @param config - The config settings, including extra wagmi configuration
 * @param config.contractName - contract name
 * @param config.functionName - name of the function to be called
 * @param config.args - arguments for the function
 * @param config.value - value in ETH that will be sent with transaction
 * @param config.blockConfirmations - number of block confirmations to wait for (default: 1)
 * @param config.onBlockConfirmation - callback that will be called after blockConfirmations.
 */
export const useNFCContractWrite = <
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, "nonpayable" | "payable">,
>({
  contractName,
  functionName,
  args,
  value,
  onBlockConfirmation,
  blockConfirmations,
  ...writeConfig
}: UseScaffoldWriteConfig<TContractName, TFunctionName>) => {
  const { data: deployedContractData } = useDeployedContractInfo(contractName);
  const { address } = useNFCAuthContext()
  const { address: wagmiAddress } = useWagmiAccount()
  const writeTx = useTransactor();
  const [isMining, setIsMining] = useState(false);

  const sendContractWriteTx = async ({
    args: newArgs,
    value: newValue,
    ...otherConfig
  }: {
    args?: UseScaffoldWriteConfig<TContractName, TFunctionName>["args"];
    value?: UseScaffoldWriteConfig<TContractName, TFunctionName>["value"];
  } & UpdatedArgs = {}) => {
    console.log({ deployedContractData })
    if (!deployedContractData) {
      notification.error("Target Contract is not deployed, did you forget to run `yarn deploy`?");
      return;
    }
    const data = encodeFunctionData({
      abi: deployedContractData?.abi as Abi,
      functionName: functionName as any,
      args: newArgs ?? args as any,
    })
    console.log({ data })
    const gasPrice = await publicClient.getGasPrice()
    console.log({ gasPrice })
    const request = await walletClient.prepareTransactionRequest({
      to: deployedContractData?.address,
      value: newValue ?? value ?? 0n,
      data: data,
      account: address as string
    })
    console.log({ request })
    let rawTransaction = rlp.encode([request.nonce, gasPrice, request.gas, request.to, request.value, request.data])
    console.log({ rawTransaction })
    const msgHex = Buffer.from(rawTransaction).toString('hex')
    console.log({ msgHex })
    const msgHash = keccak256(`0x${msgHex}`);
    const res = await execHaloCmdWeb({
      name: "sign",
      keyNo: 1,
      message: msgHash,
      format: "hex"
    }, {
      sign: "eth_sign"
    })
    console.log({ res })
    const signature = {
      r: res.signature.raw.r as `0x${string}`,
      s: res.signature.raw.s as `0x${string}`,
      v: BigInt(res.signature.raw.v)
    }
    console.log({ signature })
    const transaction = {
      from: address,
      chainId: sepolia.id,
      gas: request.gas,
      maxFeePerGas: request.maxFeePerGas,
      maxPriorityFeePerGas: request.maxPriorityFeePerGas,
      nonce: request.nonce,
      to: request.to,
      value: request.value,
    }
    console.log({ transaction, signature })
    const serializedTransaction = serializeTransaction(transaction, signature)
    console.log({ serializedTransaction })
    console.log({ maybeSender: walletClient.account, walletClient })
    const recoveredAddr = recoverAddress({ hash: serializedTransaction, signature: res.signature.ether as `0x${string}` })
    console.log({ recoveredAddr });
    const hash = await walletClient.sendRawTransaction({ serializedTransaction })
    console.log({ hash })

    try {
      setIsMining(true);

      const writeTxResult = await writeTx(
        async () => hash,
        { onBlockConfirmation, blockConfirmations },
      );

      return writeTxResult;
    } catch (e: any) {
      throw e;
    } finally {
      setIsMining(false);
    }
  };

  return {
    isMining,
    // Overwrite wagmi's write async
    writeAsync: sendContractWriteTx,
  };
};


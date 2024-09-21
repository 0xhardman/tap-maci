import { useState } from "react";
import { useTargetNetwork } from "../scaffold-eth/useTargetNetwork";
import { Abi, ExtractAbiFunctionNames } from "abitype";
import { sepolia, useContractWrite, useNetwork } from "wagmi";
import { useDeployedContractInfo, useTransactor } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { ContractAbi, ContractName, UseScaffoldWriteConfig } from "~~/utils/scaffold-eth/contract";
import { execHaloCmdWeb } from "~~/lib/libhalo/api/web.js";
import { createWalletClient, custom, encodeFunctionData, Hash, keccak256 } from "viem";
import { hexEncodedString } from "~~/utils/nfc";
import rlp from 'rlp';
import { useAuthContext } from "~~/contexts/AuthContext";
import { useNFCAuthContext } from "~~/contexts/AuthNFCContext";
import { useAccount } from "./useAccount";
import { useAccount as useWagmiAccount } from "wagmi";

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
  // const { address } = useWagmiAccount()
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
    if (!deployedContractData) {
      notification.error("Target Contract is not deployed, did you forget to run `yarn deploy`?");
      return;
    }
    const client = createWalletClient({
      account: address,
      chain: sepolia,
      transport: custom(window.ethereum!)
    })
    const data = encodeFunctionData({
      abi: deployedContractData?.abi as Abi,
      functionName: functionName as any,
      args: newArgs ?? args as any,
    })
    const request = await client.prepareTransactionRequest({
      to: deployedContractData?.address,
      value: newValue ?? value,
      data: data,
      account: address as string
    })
    console.log({ request })
    let rawTransaction = rlp.encode([request.nonce, request.gasPrice, request.gas, request.to, request.value, request.data])
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
    const { v, r, s } = res.signature.raw
    const transaction = { nonce: request.nonce, gasPrice: request.gasPrice, gasLimit: request.gas, to: request.to, value: request.value, data: request.data, v, r, s }
    console.log({ transaction })
    const signedRawTransaction = rlp.encode([transaction.nonce, transaction.gasPrice, transaction.gasLimit, transaction.to, transaction.value, transaction.data, transaction.v, transaction.r, transaction.s])
    console.log({ signedRawTransaction })
    const serializedTransaction = `0x${Buffer.from(signedRawTransaction).toString('hex')}` as `0x${string}`
    console.log({ serializedTransaction })
    const hash = await client.sendRawTransaction({ serializedTransaction })
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

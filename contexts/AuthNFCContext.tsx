"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Keypair, PrivKey } from "maci-domainobjs";
import { useSignMessage } from "~~/hooks/nfc/useSignMessage";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web.js";
import { hexEncodedString } from "~~/utils/nfc";

interface INFCAuthContext {
  address: string;
  isRegistered: boolean;
  keypair: Keypair | null;
  stateIndex: bigint | null;
  generateKeypair: () => Promise<void>;
  setUpAddressAsync: () => Promise<void>;
}

export const NFCAuthContext = createContext<INFCAuthContext>({} as INFCAuthContext);

export default function AuthNFCContextProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string>("");
  const [keypair, setKeyPair] = useState<Keypair | null>(null);
  const [stateIndex, setStateIndex] = useState<bigint | null>(null);
  const [signatureMessage, setSignatureMessage] = useState<string>("");

  const setUpAddressAsync = async () => {
    console.log('handle click in useCallback')
    try {
      const res = await execHaloCmdWeb(
        {
          name: "sign",
          keyNo: 1,
          message: hexEncodedString("1")
        })
      console.log({ res })
      setAddress(res.etherAddress);
      localStorage.setItem('address', res.etherAddress);
      // alert(res)
    } catch (error) {
      console.error(error);
    }
  }

  const { signMessageAsync } = useSignMessage({ message: signatureMessage });

  useEffect(() => {
    setSignatureMessage(`Login to ${window.location.origin}`);
  }, []);

  // const generateKeypair = useCallback(() => {
  //   console.log('generate keypair')
  //   console.log(generateKeypair, { address })
  //   if (!address) return;

  //   (async () => {
  //     try {
  //       const signature = await signMessageAsync() as `0x${string}`;
  //       const userKeyPair = new Keypair(new PrivKey(signature));
  //       setKeyPair(userKeyPair);
  //       console.log("Generated Keypair", userKeyPair);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   })();
  // }, [address, signMessageAsync]);

  const generateKeypair = async () => {
    if (!address) return;

    try {
      const signature = await signMessageAsync() as `0x${string}`;
      const userKeyPair = new Keypair(new PrivKey(signature));
      setKeyPair(userKeyPair);
    } catch (err) {
      console.error(err);
    }
  }

  // useEffect(() => {
  //   setKeyPair(null);

  //   generateKeypair();
  // }, [generateKeypair]);

  const { data: isRegistered, refetch: refetchIsRegistered } = useScaffoldContractRead({
    contractName: "MACIWrapper",
    functionName: "isPublicKeyRegistered",
    args: keypair ? keypair.pubKey.rawPubKey : [0n, 0n],
  });

  const chainId = scaffoldConfig.targetNetworks[0].id;

  const {
    MACIWrapper: { deploymentBlockNumber },
  } = deployedContracts[chainId];

  const { data: SignUpEvents } = useScaffoldEventHistory({
    contractName: "MACIWrapper",
    eventName: "SignUp",
    filters: {
      _userPubKeyX: BigInt(keypair?.pubKey.asContractParam().x || 0n),
      _userPubKeyY: BigInt(keypair?.pubKey.asContractParam().y || 0n),
    },
    fromBlock: BigInt(deploymentBlockNumber),
  });

  useEffect(() => {
    if (!keypair || !SignUpEvents || !SignUpEvents.length) {
      setStateIndex(null);
      return;
    }

    const event = SignUpEvents.filter(
      log =>
        log.args._userPubKeyX?.toString() === keypair.pubKey.asContractParam().x &&
        log.args._userPubKeyY?.toString() === keypair.pubKey.asContractParam().y,
    )[0];
    setStateIndex(event?.args?._stateIndex || null);
  }, [keypair, SignUpEvents]);

  useScaffoldEventSubscriber({
    contractName: "MACIWrapper",
    eventName: "SignUp",
    listener: logs => {
      logs.forEach(log => {
        if (
          (keypair?.pubKey.asContractParam().x !== undefined &&
            log.args._userPubKeyX !== BigInt(keypair?.pubKey.asContractParam().x)) ||
          (keypair?.pubKey.asContractParam().y !== undefined &&
            log.args._userPubKeyY !== BigInt(keypair?.pubKey.asContractParam().y))
        )
          return;
        refetchIsRegistered();
        setStateIndex(log.args._stateIndex || null);
      });
    },
  });

  return (
    <NFCAuthContext.Provider value={{ address, isRegistered: Boolean(isRegistered), keypair, stateIndex, generateKeypair, setUpAddressAsync }}>
      {children}
    </NFCAuthContext.Provider>
  );
}

export const useNFCAuthContext = () => useContext(NFCAuthContext);

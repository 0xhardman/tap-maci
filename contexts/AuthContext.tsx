"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Keypair, PrivKey } from "maci-domainobjs";
import { useAccount } from "wagmi";
import { useSignMessage } from "~~/hooks/nfc/useSignMessage";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web.js";
import { hexEncodedString } from "~~/utils/nfc";

interface IAuthContext {
  address: string;
  isRegistered: boolean;
  keypair: Keypair | null;
  stateIndex: bigint | null;
  generateKeypair: () => void;
  setUpAddressAsync: () => Promise<void>;
}

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const [bandAddress, setBandAddress] = useState<string>("");
  const [keypair, setKeyPair] = useState<Keypair | null>(null);
  const [stateIndex, setStateIndex] = useState<bigint | null>(null);
  const [signatureMessage, setSignatureMessage] = useState<string>("");


  useEffect(() => {
    setSignatureMessage(`Login to ${window.location.origin}`);
  }, []);

  const generateKeypair = async () => {
    try {
      console.log({ signatureMessage, bandAddress, address })
      if (!signatureMessage || !bandAddress || !address) {
        alert("Please set up your address first");
        return
      }
      console.log({ signatureMessage })
      const res = await execHaloCmdWeb(
        {
          name: "sign",
          keyNo: 1,
          message: hexEncodedString(signatureMessage)
        })
      console.log({ res })
      const signature = res.signature.ether;
      console.log({ signature })
      const userKeyPair = new Keypair(new PrivKey(signature));
      setKeyPair(userKeyPair);
      console.log("Generated Keypair", userKeyPair);
    } catch (err) {
      console.error(err);
    }
  }

  const setUpAddressAsync = async () => {
    console.log('handle click in useCallback')
    try {
      const res = await execHaloCmdWeb(
        {
          name: "sign",
          keyNo: 1,
          message: hexEncodedString("get address")
        })
      console.log({ res })
      setBandAddress(res.etherAddress);
      localStorage.setItem('address', res.etherAddress);
      // alert(res)
    } catch (error) {
      console.error(error);
    }
  }

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
      console.log("No keypair or events");
      console.log({ keypair, SignUpEvents });
      setStateIndex(null);
      return;
    }
    console.log({ SignUpEvents })
    console.log("keypair.pubKey.asContractParam().x", keypair.pubKey.asContractParam().x);
    console.log("keypair.pubKey.asContractParam().y", keypair.pubKey.asContractParam().y);
    const event = SignUpEvents.filter(
      log =>
        log.args._userPubKeyX?.toString() === keypair.pubKey.asContractParam().x &&
        log.args._userPubKeyY?.toString() === keypair.pubKey.asContractParam().y,
    )[0];
    console.log("!!!!!", { event })
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
    <AuthContext.Provider value={{ address: bandAddress, isRegistered: Boolean(isRegistered), keypair, stateIndex, generateKeypair, setUpAddressAsync }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);

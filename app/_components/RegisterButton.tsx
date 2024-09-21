import { useAuthContext } from "~~/contexts/AuthContext";
import { useNFCAuthContext } from "~~/contexts/AuthNFCContext";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export default function RegisterButton() {
  // const { keypair, isRegistered, generateKeypair } = useNFCAuthContext();
  const { keypair, isRegistered, generateKeypair } = useAuthContext();

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "MACIWrapper",
    functionName: "signUp",
    args: [keypair?.pubKey.asContractParam() as { x: bigint; y: bigint }, "0x", "0x"],
  });

  async function register() {
    console.log("registering");
    if (!keypair) {
      console.log("no keypair");
      return;
    }
    console.log("keypair", keypair);

    try {
      console.log("writing");
      await writeAsync({ args: [keypair.pubKey.asContractParam() as { x: bigint; y: bigint }, "0x", "0x"] });
    } catch (err) {
      console.log(err);
    }
  }

  if (!keypair) {
    return (
      <button className="border text-3xl w-full border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold" onClick={generateKeypair}>
        Login
      </button>
    );
  }

  if (isRegistered) return <div>Thanks for Registration</div>;

  return (
    <>
      (You are not registered yet)
      <button className="border text-3xl border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold" onClick={register}>
        Register
      </button>
    </>
  );
}

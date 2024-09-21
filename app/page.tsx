"use client";

import Image from "next/image";
import RegisterButton from "./_components/RegisterButton";
import type { NextPage } from "next";
import HeroImage from "~~/assets/private_voting.png";
import { useAuthUserOnly } from "~~/hooks/useAuthUserOnly";
import { useAccount } from "wagmi";
import { useAuthContext } from "~~/contexts/AuthContext";

const Home: NextPage = () => {
  useAuthUserOnly({ inverted: true });
  const { address: bandAddress } = useAuthContext();
  const { address } = useAccount();
  const final = bandAddress || address || "MACPI"
  console.log({ final })
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-5xl font-bold text-center">MAC
            <span className="text-red-500 animate-pulse">P</span>
            I</h1>

          <div className="flex flex-col-reverse md:flex-row justify-center items-center mt-10 w-3/4 text-center mx-auto gap-x-10 gap-y-5 mb-10">
            <div className="flex-1">
              <p className="text-3xl mt-5 text-center text-nowrap whitespace-nowrap">
                A reliable DAO voting infrastructure
                <br />
                for next billion users ⌐◨-◨
              </p>
              <div className="text-center w-full">
                <RegisterButton />
              </div>
            </div>
            <div className="flex-none">
              <img src={`https://noun-api.com/beta/pfp?name=${final}`} alt="MACI" className="w-[300px]" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

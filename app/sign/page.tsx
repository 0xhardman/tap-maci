'use client';
import { execHaloCmdWeb } from '~~/lib/libhalo/api/web.js';
import { useState } from 'react';
import { useNFCAuthContext } from '~~/contexts/AuthNFCContext';
import { useAccount } from '~~/hooks/nfc/useAccount';
import { hexEncodedString } from '~~/utils/nfc';

export default function SignPage() {
    const [input, setInput] = useState('');
    const [statusText, setStatusText] = useState('Click on the button');
    const { address, setUpAddress } = useAccount();

    const handleClick = async (format: string) => {
        console.log('handle click')
        try {
            const res = await execHaloCmdWeb(
                {
                    name: "sign",
                    keyNo: 1,
                    message: hexEncodedString(input)
                })
            console.log(input, hexEncodedString(input))
            console.log({ res })
            // alert(res)
        } catch (error) {
            console.error(error);
        }
    }
    return <div className='flex flex-col w-full h-full justify-center items-center mt-10'>

        <div className='flex flex-col gap-2 w-2/3'>
            <div></div>
            <input className='h-8' type="text" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className='border' onClick={() => {
                console.log('click text')
                handleClick('text')
            }} >Text sign</button>
            <button className='border' onClick={() => {
                console.log('click hex')
                handleClick('hex')
            }} >Hex sign</button>
            {address ? address : <button className='border' onClick={async () => {
                await setUpAddress()
            }} >Get Address</button>}
        </div>

    </div>;
}



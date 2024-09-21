'use client';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web.js';
import { useState } from 'react';

export default function SignPage() {
    const [input, setInput] = useState('');
    const [statusText, setStatusText] = useState('Click on the button');
    const handleClick = async (format: string) => {
        console.log('handle click')
        try {
            const res = await execHaloCmdWeb(
                {
                    name: "sign",
                    keyNo: 1,
                    message: hexEncodedString(input),
                })
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

        </div>

    </div>;
}


function hexEncodedString(input: string) {
    return Buffer.from(input).toString('hex')
}
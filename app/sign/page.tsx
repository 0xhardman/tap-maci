'use client';
import { execHaloCmdWeb } from '@arx-research/libhalo/api/web.js';
import { useState } from 'react';

export default function SignPage() {
    const [input, setInput] = useState('123');
    const [statusText, setStatusText] = useState('Click on the button');
    const handleClick = async () => {
        try {
            const res = await execHaloCmdWeb(
                {
                    name: "sign",
                    keyNo: 1,
                    message: statusText,
                    format: "text",
                })
            // console.log(res)
            alert(res)
        } catch (error) {
            console.error(error);
        }
    }
    return <div className='w-full h-full'>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} />
        <button onClick={handleClick} >21</button>
    </div>;
}

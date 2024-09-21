import { execHaloCmdWeb } from '@arx-research/libhalo/api/web.js';
import { useEffect, useState } from 'react';
import { hexEncodedString } from '~~/utils/nfc';
export function useAccount() {
    //get data from local storage
    const [address, setAddress] = useState<string>();

    // const address = localStorage.getItem('address')
    const setUpAddress = async () => {
        console.log('handle click')
        try {
            const login = await execHaloCmdWeb(
                {
                    name: "sign",
                    keyNo: 1,
                    message: hexEncodedString("1")
                })
            console.log({ login })
            setAddress(login.etherAddress);
            localStorage.setItem('address', login.etherAddress);
            // alert(res)
        } catch (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        let addressLocal = localStorage.getItem('address');
        console.log(addressLocal)
        if (!execHaloCmdWeb)
            return
        if (!addressLocal) {
            console.log('no address');
            execHaloCmdWeb(
                {
                    name: "sign",
                    keyNo: 1,
                    message: hexEncodedString("123")
                }).then((res) => {
                    localStorage.setItem('address', res.etherAddress);
                    setAddress(res.etherAddress);
                }).catch((err) => {
                    console.error(err);
                })
        }
    }, [])

    return {
        address,
        setUpAddress,
    }
}
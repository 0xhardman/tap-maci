import { execHaloCmdWeb } from '~~/lib/libhalo/api/web.js';
import { useCallback } from 'react';
import { hexEncodedString } from '~~/utils/nfc';
export function useSignMessage({ message }: { message: string }) {
    //get data from local storage
    const signMessageAsync = useCallback(async () => {
        try {
            const res = await execHaloCmdWeb(
                {
                    name: "sign",
                    keyNo: 1,
                    message: hexEncodedString(message)
                })
            console.log(`${message}${hexEncodedString(message)}`)
            console.log({ res })
            return res.signature.ether;
            // alert(res)
        } catch (error) {
            console.error(error);
        }
    }, [message]);

    return {
        signMessageAsync,
    }
}
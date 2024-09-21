declare module '@arx-research/libhalo/api/web.js' {
    export function execHaloCmdWeb(params: {
        name: string;
        keyNo: number;
        message: string;
        format?: string;
    }, options?: {
        sign?: string
    }): Promise<{
        etherAddress: string;
        input: {
            keyNo: number;
            digest: string;
            message: string;
        };
        publicKey: string;
        signature: {
            der: string;
            ether: string;
            raw: {
                r: string;
                s: string;
                v: string;
            }
        }
    }>;
}


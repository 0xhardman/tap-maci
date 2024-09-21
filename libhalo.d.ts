declare module '@arx-research/libhalo/api/web.js' {
    export function execHaloCmdWeb(params: {
        name: string;
        keyNo: number;
        message: string;
        format: string;
    }): Promise<void>;
}
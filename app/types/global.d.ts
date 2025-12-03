export {};

declare global {
    var bridgeEmitter: ((event: string, data: any) => void) | undefined;
}

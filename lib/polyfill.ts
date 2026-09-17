// Polyfill for crypto.randomUUID in non-secure browser contexts (e.g. LAN IPs like http://192.168.x.x)
if (typeof globalThis !== "undefined") {
  if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = {};
  }
  if (typeof globalThis.crypto.randomUUID !== "function") {
    // @ts-ignore
    globalThis.crypto.randomUUID = function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) => {
        const n = Number(c);
        const randomByte =
          typeof globalThis.crypto?.getRandomValues === "function"
            ? globalThis.crypto.getRandomValues(new Uint8Array(1))[0]
            : Math.floor(Math.random() * 256);
        return (n ^ ((randomByte & 15) >> (n / 4))).toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

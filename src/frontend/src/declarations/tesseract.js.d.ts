declare module "tesseract.js" {
  interface RecognizeResult {
    data: { text: string };
  }
  interface LoggerMessage {
    status: string;
    progress: number;
  }
  interface Options {
    logger?: (m: LoggerMessage) => void;
  }
  function recognize(
    image: string | File | Blob,
    lang: string,
    options?: Options,
  ): Promise<RecognizeResult>;
  const Tesseract: { recognize: typeof recognize };
  export default Tesseract;
  export { recognize };
}

declare module "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js" {
  export * from "tesseract.js";
  export { default } from "tesseract.js";
}

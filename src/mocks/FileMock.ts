import { Utils } from "../Utils.js";
import type { File } from "../types/File.js";

const uploads = new WeakMap<File, { id: string; chunks: Uint8Array[]; offset: number }>();

/**
 * @internal
 */
export class FileMock {
    constructor(
        private files?: Array<File>,
        private file?: File
    ) {}

    getContent = async () => {
        if (!this.file) {
            return new Response(undefined, { status: 404 });
        }
        return new Response(this.file.content, { status: 200 });
    };

    getListItemAllFields = async () => {
        if (!this.file) {
            return new Response(undefined, { status: 404 });
        }
        return new Response(JSON.stringify(this.file.listItemAllFields ?? {}), { status: 200 });
    };

    delete = async () => {
        if (!this.file || !this.files) {
            return new Response(undefined, { status: 404 });
        }
        this.files.splice(this.files.indexOf(this.file), 1);
        return new Response(undefined, { status: 200 });
    };

    upload = async (stage: string, id: string, chunk: Uint8Array, offset?: number) => {
        if (!this.file) {
            return new Response(undefined, { status: 404 });
        }
        if (stage === "startUpload") {
            uploads.set(this.file, { id, chunks: [chunk], offset: chunk.byteLength });
            return new Response(JSON.stringify(chunk.byteLength), { status: 200 });
        }
        const upload = uploads.get(this.file);
        if (
            !upload ||
            upload.id !== id ||
            upload.offset !== offset ||
            (stage !== "continueUpload" && stage !== "finishUpload")
        ) {
            return new Response(undefined, { status: 400 });
        }
        upload.chunks.push(chunk);
        upload.offset += chunk.byteLength;
        if (stage === "finishUpload") {
            this.file.content = Buffer.concat(upload.chunks).toString("utf8");
            uploads.delete(this.file);
            return this.get();
        }
        return new Response(JSON.stringify(upload.offset), { status: 200 });
    };

    get = async () => {
        if (!this.file) {
            return new Response(undefined, { status: 404 });
        }

        const f = Utils.upperCaseKeys(this.file);
        delete f.Content;
        f.Exists = true;

        return new Response(JSON.stringify(f), { status: 200 });
    };
}

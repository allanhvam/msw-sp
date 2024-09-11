import { Utils } from "../Utils.js";
import type { File } from "../types/File.js";

/**
 * @internal
 */
export class FileMock {
    constructor(private files?: Array<File>, private file?: File) {
    }

    get = async () => {
        if (!this.file) {
            return new Response(undefined, { status: 404 });
        }

        const f = Utils.upperCaseKeys(this.file);
        delete f.Content;
        return new Response(
            JSON.stringify(f),
            { status: 200 },
        );
    };
}
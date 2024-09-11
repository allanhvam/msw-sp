import { Utils } from "../Utils.js";
import type { Folder } from "../types/Folder.js";

/**
 * @internal
 */
export class FolderMock {
    constructor(private folder: Folder) {
    }

    get = async () => {
        if (!this.folder) {
            return new Response(undefined, { status: 404 });
        }

        return new Response(
            JSON.stringify(Utils.upperCaseKeys(this.folder)),
            { status: 200 },
        );
    };
}
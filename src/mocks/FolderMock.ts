import { Utils } from "../Utils.js";
import type { Folder } from "../types/Folder.js";
import { FilesMock } from "./FilesMock.js";

/**
 * @internal
 */
export class FolderMock {
    constructor(private folder: Folder) {
    }

    public get files() {
        return new FilesMock(this.folder.files);
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
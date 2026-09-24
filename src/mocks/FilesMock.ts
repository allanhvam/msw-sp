import type { File } from "../types/File.js";
import { FileMock } from "./FileMock.js";

/**
 * @internal
 */
export class FilesMock {
    constructor(private files?: Array<File>) {}

    getByName = (name: string) => {
        return new FileMock(
            this.files,
            this.files?.find((file) => file.name === name)
        );
    };

    add = (name: string, serverRelativeUrl: string, overwrite: boolean) => {
        if (!this.files) {
            return new Response(undefined, { status: 404 });
        }
        const existing = this.files.find((file) => file.name === name);
        if (existing && !overwrite) {
            return new Response(undefined, { status: 409 });
        }
        if (existing) {
            existing.content = "";
        } else {
            this.files.push({ name, content: "" });
        }
        return new Response(JSON.stringify({ ServerRelativeUrl: serverRelativeUrl }), {
            status: 200,
        });
    };

    get = async () => {
        if (!this.files) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.files.map((file) => new FileMock(this.files, file));
        const infos = new Array<any>();
        for (let i = 0; i !== mocks.length; i++) {
            const list = await mocks[i].get();
            infos.push(await list.json());
        }

        return new Response(JSON.stringify(infos), { status: 200 });
    };
}

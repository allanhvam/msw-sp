import type { File } from '../types/File.js';
import { FileMock } from './FileMock.js';

/**
 * @internal
 */
export class FilesMock {
    constructor(private files?: Array<File>) {
    }

    get = async () => {
        if (!this.files) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.files.map(file => new FileMock(this.files, file));
        const infos = new Array<any>();
        for (let i = 0; i !== mocks.length; i++) {
            const list = await mocks[i].get();
            infos.push(await list.json());
        }

        return new Response(
            JSON.stringify(infos),
            { status: 200 },
        );
    };
}
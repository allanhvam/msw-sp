import type { DefaultBodyType } from "msw";
import { ItemMock } from "./ItemMock.js";

/**
 * @internal
 */
export class ItemsMock {
    constructor(private items?: Array<Record<string, any>>) {
    }

    getById = (id: number | string) => {
        if (!id.toString()) {
            return new ItemMock(this.items, undefined);
        }
        const item = this.items?.find(item =>
            item.Id?.toString() === id.toString() ||
            item.ID?.toString() === id.toString());

        return new ItemMock(this.items, item);
    };

    get = async () => {
        if (!this.items) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.items.map(item => new ItemMock(this.items, item));
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

    post = async (payload: DefaultBodyType) => {
        let ids = this.items?.map(i => i.Id).filter(i => i).map(i => Number.parseInt(i));
        if (!ids || ids.length === 0) {
            ids = [0];
        }
        const max = Math.max(...ids);
        this.items?.push(Object.assign({ Id: max + 1 }, payload));

        return new Response(
            JSON.stringify({}),
            { status: 200 },
        );
    };
}
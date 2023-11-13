import type { List } from "../types/List.js";
import { ListMock } from "./ListMock.js";

/**
 * @internal
 */
export class ListsMock {

    constructor(private lists?: Array<List>) {
    }

    getByTitle = (title: string) => {
        const list = this.lists?.find(list => list.title === title);
        return new ListMock(list);
    };

    getById = (id: string) => {
        const list = this.lists?.find(list => list.id === id);
        return new ListMock(list);
    };

    get = async () => {
        if (!this.lists) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.lists.map(list => new ListMock(list));
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
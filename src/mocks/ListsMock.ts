import { Utils } from "../Utils.js";
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
        return new ListMock(this.lists, list);
    };

    getById = (id: string) => {
        const list = this.lists?.find(list => list.id === id);
        return new ListMock(this.lists, list);
    };

    get = async () => {
        if (!this.lists) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.lists.map(list => new ListMock(this.lists, list));
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

    post = async (payload: any) => {
        if (this.lists === undefined) {
            this.lists = [];
        }
        const list = Utils.lowerCaseKeys(payload) as List;
        list.id = Utils.strings.getGUID();
        list.created = new Date().toISOString();
        list.items = [];
        this.lists.push(list);

        return await new ListMock(this.lists, list).get();
    };
}
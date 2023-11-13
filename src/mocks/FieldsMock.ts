import type { Field } from "../types/Field.js";
import { FieldMock } from "./FieldMock.js";

/**
 * @internal
 */
export class FieldsMock {
    constructor(private fields?: Array<Field>) {
    }

    get = async () => {
        if (!this.fields) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.fields.map(list => new FieldMock(list));
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
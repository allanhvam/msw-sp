import { ViewFieldMock } from "./ViewFieldMock.js";

/**
 * @internal
 */
export class ViewFieldsMock {
    constructor(private viewField?: Array<string>) {
    }

    get = async () => {
        if (!this.viewField) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.viewField.map(viewField => new ViewFieldMock(viewField));
        const infos = new Array<any>();
        for (let i = 0; i !== mocks.length; i++) {
            const list = await mocks[i].get();
            infos.push(await list.json());
        }

        return new Response(
            JSON.stringify({ Items: infos }),
            { status: 200 },
        );
    };
}
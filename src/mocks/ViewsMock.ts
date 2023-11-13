import type { View } from "../types/View.js";
import { ViewMock } from "./ViewMock.js";

/**
 * @internal
 */
export class ViewsMock {
    constructor(private views?: Array<View>) {
    }

    get = async () => {
        if (!this.views) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.views.map(view => new ViewMock(view));
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
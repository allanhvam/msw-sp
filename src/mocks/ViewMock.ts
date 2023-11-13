import { Utils } from "../Utils.js";
import type { View } from "../types/View.js";
import { ViewFieldsMock } from "./ViewFieldsMock.js";

/**
 * @internal
 */
export class ViewMock {
    constructor(private view?: View) {
    }

    public get viewFields() {
        return new ViewFieldsMock(this.view?.fields);
    }

    get = async () => {
        if (!this.view) {
            return new Response(undefined, { status: 404 });
        }

        return new Response(
            JSON.stringify(Utils.upperCaseKeys(this.view)),
            { status: 200 },
        );
    };
}
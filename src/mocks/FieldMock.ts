import { Utils } from "../Utils.js";
import type { Field } from "../types/Field.js";

/**
 * @internal
 */
export class FieldMock {
    constructor(private field: Field) {
    }

    get = async () => {
        if (!this.field) {
            return new Response(undefined, { status: 404 });
        }

        return new Response(
            JSON.stringify(Utils.upperCaseKeys(this.field)),
            { status: 200 },
        );
    };
}
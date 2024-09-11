import type { DefaultBodyType } from "msw";
import { BasePermissionsMock } from "./BasePermissionsMock.js";

/**
 * @internal
 */
export class ItemMock {
    constructor(private items?: Array<Record<string, any>>, private item?: Record<string, any>) {
    }

    public get effectiveBasePermissions() {
        return new BasePermissionsMock(this);
    }

    get = async () => {
        if (!this.item) {
            return new Response(undefined, { status: 404 });
        }

        const item = Object.assign({}, this.item);
        if (typeof item.ID === "undefined" && typeof item.Id !== "undefined") {
            item.ID = item.Id;
        }

        return new Response(
            JSON.stringify(item),
            { status: 200 },
        );
    };

    post = async (payload: DefaultBodyType) => {
        if (!this.item) {
            return new Response(undefined, { status: 404 });
        }

        Object.assign(this.item, payload);

        return new Response(
            JSON.stringify({}),
            { status: 200 },
        );
    };

    delete = async () => {
        if (!this.item) {
            return new Response(undefined, { status: 404 });
        }

        const index = this.items?.findIndex(i => i.Id === this.item!.Id);
        this.item = undefined;
        if (index !== undefined) {
            this.items?.splice(index, 1);
        }

        return new Response(
            JSON.stringify({}),
            { status: 200 },
        );
    };

    validateUpdateListItem = async (payload: DefaultBodyType) => {
        if (!this.item) {
            return new Response(undefined, { status: 404 });
        }

        const obj = payload as {
            formValues: Array<{
                FieldName: string,
                FieldValue: string
            }>,
            bNewDocumentUpdate?: boolean
        };

        obj.formValues.reduce((a, b) => {
            a[b.FieldName] = b.FieldValue;
            return a;
        }, this.item);

        return new Response(
            JSON.stringify({}),
            {
                status: 200,
            },
        );
    };
}
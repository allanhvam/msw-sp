import { BasePermissionsMock } from "./BasePermissionsMock.js";

/**
 * @internal
 */
export class ItemMock {

    constructor(private item?: Record<string, any>) {
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
}
import type { List } from "../types/List.js";
import { BasePermissionsMock } from "./BasePermissionsMock.js";
import { FieldsMock } from "./FieldsMock.js";
import { ItemsMock } from "./ItemsMock.js";
import { ViewMock } from "./ViewMock.js";
import { ViewsMock } from "./ViewsMock.js";

/**
 * @internal
 */
export class ListMock {
    constructor(private list?: List) {
    }

    public get fields() {
        return new FieldsMock(this.list?.fields);
    }

    public get items() {
        return new ItemsMock(this.list?.items);
    }

    public get effectiveBasePermissions() {
        return new BasePermissionsMock(this);
    }

    public get views() {
        return new ViewsMock(this.list?.views);
    }

    public get defaultView() {
        return new ViewMock(this.list?.views?.find(view => view.defaultView));
    }

    public get forms() {
        return {
            get: () => {
                return new Response(
                    JSON.stringify([
                        {
                            "ServerRelativeUrl": `/${this.list?.title}/EditForm.aspx`,
                            "FormType": 6
                        }
                    ]),
                    { status: 200 },
                );
            }
        };
    }

    get = async () => {
        if (!this.list) {
            return new Response(undefined, { status: 404 });
        }

        return new Response(
            JSON.stringify({
                Id: this.list.id,
                Title: this.list.title,
                ItemCount: this.list.items.length,
                Hidden: this.list.hidden,
                BaseTemplate: this.list.baseTemplate,
            }),
            { status: 200 },
        );
    };
}
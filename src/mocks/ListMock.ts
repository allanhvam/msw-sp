import type { DefaultBodyType } from "msw";
import { Utils } from "../Utils.js";
import type { List } from "../types/List.js";
import { BasePermissionsMock } from "./BasePermissionsMock.js";
import { FieldsMock } from "./FieldsMock.js";
import { FolderMock } from "./FolderMock.js";
import { ItemsMock } from "./ItemsMock.js";
import { ViewMock } from "./ViewMock.js";
import { ViewsMock } from "./ViewsMock.js";

/**
 * @internal
 */
export class ListMock {
    constructor(private lists?: Array<List>, private list?: List) {
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

    public get rootFolder() {
        if (this.list && "rootFolder" in this.list && this.list.rootFolder) {
            return new FolderMock(this.list.rootFolder);
        }
        return new FolderMock({ name: this.list?.title });
    }

    public get forms() {
        return {
            get: async () => {
                if (!this.list) {
                    return new Response(
                        undefined,
                        { status: 404 },
                    );
                }
                if (!this.list.forms) {
                    return new Response(
                        JSON.stringify([
                            {
                                "ServerRelativeUrl": `/${this.list.url || this.list.title}/DispForm.aspx`,
                                "FormType": 4
                            },
                            {
                                "ServerRelativeUrl": `/${this.list.url || this.list.title}/EditForm.aspx`,
                                "FormType": 6
                            }
                        ]),
                        { status: 200 },
                    );
                }

                return new Response(
                    JSON.stringify(this.list.forms.map(Utils.upperCaseKeys)
                    ),
                    { status: 200 },
                );
            }
        };
    }

    get = async () => {
        if (!this.list) {
            return new Response(undefined, { status: 404 });
        }

        const created = this.list?.created ?? new Date(0).toISOString();

        const getLastItemModifiedDate = () => {
            const getDate = (item: Record<string, any>) => {
                if (item.Modified) {
                    return new Date(item.Modified).getTime();
                }
                if (item.Created) {
                    return new Date(item.Created).getTime();
                }
                return new Date(0).getTime();
            };
            const sortedItems = [...this.list?.items ?? []].sort((a, b) => getDate(b) - getDate(a));
            const lastModifiedItem = sortedItems[0];
            const lastItemModifiedDate = lastModifiedItem?.Modified ?? lastModifiedItem?.Created ?? created;
            return lastItemModifiedDate;
        };

        return new Response(
            JSON.stringify({
                ...Utils.upperCaseKeys(Utils.objects.getSimple(this.list)),
                ...{
                    Created: created,
                    LastItemModifiedDate: getLastItemModifiedDate(),
                    ItemCount: this.list.items.length,
                },
            }),
            { status: 200 },
        );
    };

    post = async (payload: DefaultBodyType) => {
        if (!this.list) {
            return new Response(undefined, { status: 404 });
        }

        Object.assign(this.list, payload);

        return new Response(
            JSON.stringify({}),
            { status: 200 },
        );
    };

    delete = async () => {
        if (!this.list) {
            return new Response(undefined, { status: 404 });
        }

        const index = this.lists?.findIndex(i => i.id === this.list!.id);
        this.list = undefined;
        if (index !== undefined) {
            this.lists?.splice(index, 1);
        }

        return new Response(
            JSON.stringify({}),
            { status: 200 },
        );
    };
}
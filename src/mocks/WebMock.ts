import { Utils } from "../Utils.js";
import type { Site } from "../types/Site.js";
import type { Web } from "../types/Web.js";
import { BasePermissionsMock } from "./BasePermissionsMock.js";
import { ListMock } from "./ListMock.js";
import { ListsMock } from "./ListsMock.js";
import { UsersMock } from "./UsersMock.js";
import type { Parent } from "./types/Parent.js";

/**
 * @internal
 */
export class WebMock {
    constructor(private web: Parent<Site, Web>) {
    }

    public get lists() {
        return new ListsMock(this.web.lists);
    }

    public get siteUsers() {
        return new UsersMock(this.web.parent?.users);
    }

    public get effectiveBasePermissions() {
        return new BasePermissionsMock(this);
    }

    public get defaultDocumentLibrary() {
        const list = this.web.lists?.find(l => l.baseTemplate === 101 && l.isDefaultDocumentLibrary);
        return new ListMock(list);
    }

    public ensureUser(payload: { logonName: string }) {
        const user = this.web.parent?.users?.find(u => u.loginName === payload.logonName);
        if (!user) {
            return new Response(undefined, { status: 404 });
        }
        return new Response(
            JSON.stringify({
                value: {
                    Id: user.id,
                    Title: user.title,
                }
            }), { status: 200 });
    }

    getList = (listRelativeUrl: string) => {
        const list = this.web?.lists?.find(list => {
            const url = Utils.urls.combine(this.web.serverRelativeUrl, list.url);
            return Utils.urls.equals(url, listRelativeUrl);
        });

        return new ListMock(list);
    };

    get = async () => {
        if (!this.web) {
            return new Response(undefined, { status: 404 });
        }
        return new Response(
            JSON.stringify({
                Title: this.web.title,
                ServerRelativeUrl: this.web.serverRelativeUrl,
            }),
            { status: 200 },
        );
    };
}
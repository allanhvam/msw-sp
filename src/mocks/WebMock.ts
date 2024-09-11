import { Utils } from "../Utils.js";
import type { Folder } from "../types/Folder.js";
import type { Site } from "../types/Site.js";
import type { Web } from "../types/Web.js";
import { BasePermissionsMock } from "./BasePermissionsMock.js";
import { FileMock } from "./FileMock.js";
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
        return new ListMock(this.web?.lists, list);
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

        return new ListMock(this.web?.lists, list);
    };

    getFileById = (id: string) => {
        if (!this.web.lists) {
            return new FileMock(undefined, undefined);
        }
        for (let i = 0; i !== this.web.lists?.length; i++) {
            const list = this.web.lists[i];
            if (list.baseTemplate !== 101 || !list.rootFolder) {
                continue;
            }

            const getFile = (folder: Folder) => {
                if (!folder) {
                    return undefined;
                }
                let file = folder.files?.find(f => f.uniqueId === id);
                if (file) {
                    return file;
                }
                if (folder.folders) {
                    for (let i = 0; i !== folder.folders?.length; i++) {
                        file = getFile(folder.folders[i]);
                        if (file) {
                            return file;
                        }
                    }   
                }
                return undefined;
            };

            const file = getFile(list.rootFolder);
            if (file) {
                return new FileMock(list.rootFolder.files, file);
            }
        }

        return new FileMock(undefined, undefined);
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
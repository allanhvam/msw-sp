import type { DefaultBodyType, DelayMode, PathParams, ResponseResolver, StrictRequest } from "msw";
import { delay, http } from "msw";
import type { HttpRequestResolverExtras } from "msw/lib/core/handlers/HttpHandler.js";
import { personPlaceholder } from "./assets/people-placeholder.js";
import { TenantMock } from "./mocks/TenantMock.js";
import { filter, orderBy, select, top } from "./odata-query-options/index.js";
import type { Tenant } from "./types/Tenant.js";
import { Utils } from "./Utils.js";

const response = async (response: Response, info: { request: StrictRequest<DefaultBodyType> }) => {
    if (response.status !== 200) {
        return response;
    }

    let json = await response.json();
    const url = info.request.url;

    // Handle OData params
    if (Array.isArray(json)) {
        json = filter(url, json);
        json = orderBy(url, json);
        json = top(url, json);
        if (json instanceof Response) {
            return json;
        }
    }
    json = select(url, json);

    return new Response(JSON.stringify(json), {
        status: response.status,
        statusText: response.statusText,
    });
};

export const handlers = (options: Tenant | { tenant: Tenant; delay?: DelayMode | number }) => {
    const tenant = "tenant" in options ? options.tenant : options;
    const tenantMock = new TenantMock(tenant);

    const wrap = <T extends Record<string, unknown>>(resolver: ResponseResolver<T>) => {
        return async (...info: Parameters<ResponseResolver<T>>) => {
            if ("delay" in options) {
                await delay(options.delay);
            }
            return await resolver(...info);
        };
    };

    const get = (
        path: string,
        resolver: ResponseResolver<HttpRequestResolverExtras<PathParams>>
    ) => {
        return [
            http.get(`${tenant.url}/sites/:site${path}`, wrap(resolver)),
            http.get(`${tenant.url}${path}`, wrap(resolver)),
            http.get(`/sites/:site${path}`, wrap(resolver)),
            http.get(`${path}`, wrap(resolver)),
        ];
    };

    const post = (
        path: string,
        resolver: ResponseResolver<
            HttpRequestResolverExtras<PathParams>,
            DefaultBodyType,
            undefined
        >
    ) => {
        return [
            http.post(`${tenant.url}/sites/:site${path}`, wrap(resolver)),
            http.post(`${tenant.url}${path}`, wrap(resolver)),
            http.post(`/sites/:site${path}`, wrap(resolver)),
            http.post(`${path}`, wrap(resolver)),
        ];
    };
    // Library used to match path:
    // https://github.com/pillarjs/path-to-regexp
    return [
        // MARK: GET
        ...get("/_layouts/15/userphoto.aspx", (info) => {
            const site = info.params.site?.toString();
            const existingSite = site
                ? tenant.sites?.[site]
                : tenant.sites?.["/"] || tenant.sites?.[""];
            if (!existingSite) {
                return new Response(undefined, { status: 404 });
            }
            const image = Uint8Array.from(atob(personPlaceholder), (character) =>
                character.charCodeAt(0)
            );
            return new Response(image, {
                headers: { "Content-Type": "image/png" },
            });
        }),
        ...get("/_api/site/rootweb", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.get(), info);
        }),
        ...get(`/_api/web`, async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.get(), info);
        }),
        ...get(`/_api/web/lists`, async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.get(), info);
        }),
        ...get(`/_api/web/lists/getByTitle\\(':title'\\)`, async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();

            if (!title) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).get(),
                info
            );
        }),
        ...get(`/_api/web/lists\\(':listId'\\)`, async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId?.toString();

            if (!listId) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).get(),
                info
            );
        }),
        ...get(`/_api/web/lists\\(':listId'\\)/fields`, async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId?.toString();

            if (!listId) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).fields.get(),
                info
            );
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/fields", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();

            if (!title) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).fields.get(),
                info
            );
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl?.toString();

            if (!listRelativeUrl) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).get(),
                info
            );
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/forms", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl?.toString();

            if (!listRelativeUrl) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).forms.get(),
                info
            );
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/fields", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl?.toString();

            if (!listRelativeUrl) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).fields.get(),
                info
            );
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/defaultView/viewfields", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl?.toString();

            if (!listRelativeUrl) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.getList(listRelativeUrl)
                    .defaultView.viewFields.get(),
                info
            );
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl?.toString();

            if (!listRelativeUrl) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).items.get(),
                info
            );
        }),
        ...get(
            "/_api/web/getList\\(':listRelativeUrl'\\)/rootFolder/files\\(':name'\\)/$value",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();

                if (!listRelativeUrl || !name) {
                    return new Response(undefined, { status: 404 });
                }

                return tenantMock.sites
                    .getSite(site)
                    .rootWeb.getList(listRelativeUrl)
                    .rootFolder.files.getByName(name)
                    .getContent();
            }
        ),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/rootFolder/files", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl?.toString();

            if (!listRelativeUrl) {
                return new Response(undefined, { status: 404 });
            }

            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.getList(listRelativeUrl)
                    .rootFolder.files.get(),
                info
            );
        }),
        ...get(
            "/_api/site/rootweb/getList\\(':listRelativeUrl'\\)/rootFolder/files",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();

                if (!listRelativeUrl) {
                    return new Response(undefined, { status: 404 });
                }

                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.getList(listRelativeUrl)
                        .rootFolder.files.get(),
                    info
                );
            }
        ),
        ...get(
            "/_api/web/getList\\(':listRelativeUrl'\\)/rootFolder/files\\(':name'\\)",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();

                if (!listRelativeUrl || !name) {
                    return new Response(undefined, { status: 404 });
                }

                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.getList(listRelativeUrl)
                        .rootFolder.files.getByName(name)
                        .get(),
                    info
                );
            }
        ),
        ...get(
            "/_api/site/rootweb/getList\\(':listRelativeUrl'\\)/rootFolder/files\\(':name'\\)",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();

                if (!listRelativeUrl || !name) {
                    return new Response(undefined, { status: 404 });
                }

                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.getList(listRelativeUrl)
                        .rootFolder.files.getByName(name)
                        .get(),
                    info
                );
            }
        ),
        ...get(
            "/_api/site/rootweb/getList\\(':listRelativeUrl'\\)/rootFolder/files\\(':name'\\)/listItemAllFields",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();

                if (!listRelativeUrl || !name) {
                    return new Response(undefined, { status: 404 });
                }

                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.getList(listRelativeUrl)
                        .rootFolder.files.getByName(name)
                        .getListItemAllFields(),
                    info
                );
            }
        ),
        ...get(
            "/_api/site/rootweb/getList\\(':listRelativeUrl'\\)/rootFolder/files\\(':name'\\)/$value",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();

                if (!listRelativeUrl || !name) {
                    return new Response(undefined, { status: 404 });
                }

                return tenantMock.sites
                    .getSite(site)
                    .rootWeb.getList(listRelativeUrl)
                    .rootFolder.files.getByName(name)
                    .getContent();
            }
        ),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();
            if (!title) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.get(),
                info
            );
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/rootFolder", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();
            if (!title) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.lists.getByTitle(title)
                    .rootFolder.get(),
                info
            );
        }),
        ...get("/_api/web/defaultDocumentLibrary/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(
                await tenantMock.sites.getSite(site).rootWeb.defaultDocumentLibrary.items.get(),
                info
            );
        }),
        ...get("/_api/web/lists\\(':listId'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId?.toString();
            if (!listId) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).items.get(),
                info
            );
        }),
        ...get("/_api/web/lists\\(':listId'\\)/rootFolder", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId?.toString();
            if (!listId) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).rootFolder.get(),
                info
            );
        }),
        ...get("/_api/web/lists\\(':listId'\\)/forms", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId?.toString();
            if (!listId) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).forms.get(),
                info
            );
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/forms", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();
            if (!title) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).forms.get(),
                info
            );
        }),
        ...get("/_api/web/lists\\(':listId'\\)/items\\(:itemId\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId?.toString();
            const itemId = info.params.itemId?.toString();
            if (!listId || !itemId) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.lists.getById(listId)
                    .items.getById(itemId)
                    .get(),
                info
            );
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/items\\(:itemId\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();
            const itemId = info.params.itemId?.toString();
            if (!title || !itemId) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.lists.getByTitle(title)
                    .items.getById(itemId)
                    .get(),
                info
            );
        }),
        ...get(
            "/_api/web/lists/getByTitle\\(':title'\\)/EffectiveBasePermissions",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const title = info.params.title?.toString();
                if (!title) {
                    return new Response(undefined, { status: 404 });
                }
                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.lists.getByTitle(title)
                        .effectiveBasePermissions.get(),
                    info
                );
            }
        ),
        ...get("/_api/web/defaultDocumentLibrary", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(
                await tenantMock.sites.getSite(site).rootWeb.defaultDocumentLibrary.get(),
                info
            );
        }),
        ...get("/_api/web/defaultDocumentLibrary/EffectiveBasePermissions", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.defaultDocumentLibrary.effectiveBasePermissions.get(),
                info
            );
        }),
        ...get("/_api/web/defaultDocumentLibrary/rootFolder", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.defaultDocumentLibrary.rootFolder.get(),
                info
            );
        }),
        ...get("/_api/web/defaultDocumentLibrary/rootFolder/files", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.defaultDocumentLibrary.rootFolder.files.get(),
                info
            );
        }),
        ...get("/_api/web/defaultDocumentLibrary/getitems", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(
                await tenantMock.sites.getSite(site).rootWeb.defaultDocumentLibrary.items.get(),
                info
            );
        }),
        ...get("/_api/web/EffectiveBasePermissions", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(
                await tenantMock.sites.getSite(site).rootWeb.effectiveBasePermissions.get(),
                info
            );
        }),
        ...get(
            "/_api/web/lists/getByTitle\\(':title'\\)/items\\(:itemId\\)/EffectiveBasePermissions",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const title = info.params.title?.toString();
                const itemId = info.params.itemId?.toString();
                if (!title || !itemId) {
                    return new Response(undefined, { status: 404 });
                }
                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.lists.getByTitle(title)
                        .items.getById(itemId)
                        .effectiveBasePermissions.get(),
                    info
                );
            }
        ),
        ...get("/_api/web/regionalSettings/timezone", async (info) => {
            return response(
                new Response(
                    JSON.stringify({
                        Description: "(UTC+01:00) Brussels, Copenhagen, Madrid, Paris",
                        Id: 3,
                        Information: {
                            Bias: -60,
                            DaylightBias: -60,
                            StandardBias: 0,
                        },
                    }),
                    { status: 200 }
                ),
                info
            );
        }),
        ...get("/_api/web/siteUsers/getById\\(:id\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const id = info.params.id?.toString();
            if (!id) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.siteUsers.getById(id).get(),
                info
            );
        }),
        ...get("/_api/web/getFileById\\(':id'\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const id = info.params.id?.toString();
            if (!id) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.getFileById(id).get(),
                info
            );
        }),
        ...get("/_api/web/getFileByServerRelativePath\\(decodedUrl=':path'\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const path = info.params.path?.toString();
            if (!path) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.getFileByServerRelativePath(path)
                    .get(),
                info
            );
        }),
        ...get(
            "/_api/web/getFileByServerRelativePath\\(decodedUrl=':path'\\)/$value",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const path = info.params.path?.toString();
                if (!path) {
                    return new Response(undefined, { status: 404 });
                }
                return tenantMock.sites
                    .getSite(site)
                    .rootWeb.getFileByServerRelativePath(path)
                    .getContent();
            }
        ),
        ...get(
            "/_api/web/getFileByServerRelativePath\\(decodedUrl=':path'\\)/listItemAllFields",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const path = info.params.path?.toString();
                if (!path) {
                    return new Response(undefined, { status: 404 });
                }
                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.getFileByServerRelativePath(path)
                        .getListItemAllFields(),
                    info
                );
            }
        ),
        ...get("/_api/*", async (info) => {
            return response(
                new Response(undefined, { status: 501, statusText: "Not Implemented (GET)" }),
                info
            );
        }),
        ...get("/*", async ({ request }) => {
            const filePath = decodeURIComponent(new URL(request.url).pathname);
            for (const [siteName, site] of Object.entries(tenant.sites ?? {})) {
                const web = site.rootWeb;
                if (!web?.serverRelativeUrl) {
                    continue;
                }
                const library = web.lists?.find((list) => {
                    if (list.baseTemplate !== 101) {
                        return false;
                    }
                    const path = Utils.urls.combine(web.serverRelativeUrl, list.url);
                    const prefix = `${Utils.strings.trimEnd(path, "/")}/`;
                    return filePath.toLowerCase().startsWith(prefix.toLowerCase());
                });
                if (library) {
                    return tenantMock.sites
                        .getSite(siteName)
                        .rootWeb.getFileByServerRelativePath(filePath)
                        .getContent();
                }
            }
        }),

        // MARK: POST
        ...post(
            "/_api/site/rootweb/getList\\(':listRelativeUrl'\\)/rootFolder/files/AddUsingPath\\(decodedurl=':name'\\)",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();
                if (!listRelativeUrl || !name) {
                    return new Response(undefined, { status: 404 });
                }
                const fileUrl = `${listRelativeUrl.replace(/\/$/, "")}/${name}`;
                return response(
                    tenantMock.sites
                        .getSite(site)
                        .rootWeb.getList(listRelativeUrl)
                        .rootFolder.files.add(name, fileUrl, false),
                    info
                );
            }
        ),
        ...post(
            "/_api/site/rootweb/getList\\(':listRelativeUrl'\\)/rootFolder/files/AddUsingPath\\(decodedurl=':name',Overwrite=:overwrite\\)",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();
                const overwrite = info.params.overwrite?.toString();
                if (!listRelativeUrl || !name || !overwrite) {
                    return new Response(undefined, { status: 404 });
                }
                const fileUrl = `${listRelativeUrl.replace(/\/$/, "")}/${name}`;
                return response(
                    tenantMock.sites
                        .getSite(site)
                        .rootWeb.getList(listRelativeUrl)
                        .rootFolder.files.add(name, fileUrl, overwrite === "true"),
                    info
                );
            }
        ),
        ...post(
            "/_api/web/getFileByServerRelativePath\\(decodedUrl=':path'\\)/:stage\\(uploadId=guid':id'\\)",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const path = info.params.path?.toString();
                const stage = info.params.stage?.toString();
                const id = info.params.id?.toString();
                if (!path || !stage || !id) {
                    return new Response(undefined, { status: 404 });
                }
                const chunk = new Uint8Array(await info.request.arrayBuffer());
                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.getFileByServerRelativePath(path)
                        .upload(stage, id, chunk),
                    info
                );
            }
        ),
        ...post(
            "/_api/web/getFileByServerRelativePath\\(decodedUrl=':path'\\)/:stage\\(uploadId=guid':id',fileOffset=:offset\\)",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const path = info.params.path?.toString();
                const stage = info.params.stage?.toString();
                const id = info.params.id?.toString();
                const offset = info.params.offset?.toString();
                if (!path || !stage || !id || !offset) {
                    return new Response(undefined, { status: 404 });
                }
                const chunk = new Uint8Array(await info.request.arrayBuffer());
                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.getFileByServerRelativePath(path)
                        .upload(stage, id, chunk, Number(offset)),
                    info
                );
            }
        ),
        ...post(
            "/_api/site/rootweb/getList\\(':listRelativeUrl'\\)/rootFolder/files\\(':name'\\)",
            async (info) => {
                if (info.request.headers.get("x-http-method") !== "DELETE") {
                    return new Response(undefined, { status: 501 });
                }
                const site = info.params.site?.toString() || "/";
                const listRelativeUrl = info.params.listRelativeUrl?.toString();
                const name = info.params.name?.toString();
                if (!listRelativeUrl || !name) {
                    return new Response(undefined, { status: 404 });
                }
                return tenantMock.sites
                    .getSite(site)
                    .rootWeb.getList(listRelativeUrl)
                    .rootFolder.files.getByName(name)
                    .delete();
            }
        ),
        ...post(
            "/_api/sp.ui.applicationpages.clientpeoplepickerwebserviceinterface.clientpeoplepickersearchuser",
            async (info) => {
                const payload = info.request.json();
                return response(tenantMock.clientPeoplePickerSearchUser(payload), info);
            }
        ),
        ...post("/_api/web/ensureuser", async (info) => {
            const site = info.params.site?.toString() || "/";
            const payload = (await info.request.json()) as any;
            return response(tenantMock.sites.getSite(site).rootWeb.ensureUser(payload), info);
        }),
        ...post("/_api/web/lists", async (info) => {
            const site = info.params.site?.toString() || "/";
            const payload = (await info.request.json()) as any;
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.post(payload), info);
        }),
        ...post("/_api/web/getList\\(':listRelativeUrl'\\)/getitems", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl?.toString();
            if (!listRelativeUrl) {
                return new Response(undefined, { status: 404 });
            }
            return response(
                await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).items.get(),
                info
            );
        }),
        ...post("/_api/web/lists/getByTitle\\(':title'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();
            if (!title) {
                return new Response(undefined, { status: 404 });
            }
            const payload = await info.request.json();
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.lists.getByTitle(title)
                    .items.post(payload),
                info
            );
        }),
        ...post("/_api/web/lists/getByTitle\\(':title'\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();
            if (!title) {
                return new Response(undefined, { status: 404 });
            }

            if (info.request.headers.get("x-http-method") === "DELETE") {
                return response(
                    await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).delete(),
                    info
                );
            }

            const payload = await info.request.json();
            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).post(payload),
                info
            );
        }),
        ...post("/_api/web/lists\\(':listId'\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId?.toString();
            if (!listId) {
                return new Response(undefined, { status: 404 });
            }

            if (info.request.headers.get("x-http-method") === "DELETE") {
                return response(
                    await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).delete(),
                    info
                );
            }

            const payload = await info.request.json();
            return response(
                await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).post(payload),
                info
            );
        }),
        ...post("/_api/web/lists/getByTitle\\(':title'\\)/items\\(:id\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title?.toString();
            const id = info.params.id?.toString();
            if (!title || !id) {
                return new Response(undefined, { status: 404 });
            }

            if (info.request.headers.get("x-http-method") === "DELETE") {
                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.lists.getByTitle(title)
                        .items.getById(id)
                        .delete(),
                    info
                );
            }

            const payload = await info.request.json();
            return response(
                await tenantMock.sites
                    .getSite(site)
                    .rootWeb.lists.getByTitle(title)
                    .items.getById(id)
                    .post(payload),
                info
            );
        }),
        ...post(
            "/_api/web/lists/getByTitle\\(':title'\\)/items\\(:id\\)/validateupdatelistitem",
            async (info) => {
                const site = info.params.site?.toString() || "/";
                const title = info.params.title?.toString();
                const id = info.params.id?.toString();
                if (!title || !id) {
                    return new Response(undefined, { status: 404 });
                }
                const payload = await info.request.json();
                return response(
                    await tenantMock.sites
                        .getSite(site)
                        .rootWeb.lists.getByTitle(title)
                        .items.getById(id)
                        .validateUpdateListItem(payload),
                    info
                );
            }
        ),
        ...post("/_api/*", async (...params) => {
            return response(
                new Response(undefined, { status: 501, statusText: "Not Implemented (POST)" }),
                ...params
            );
        }),
    ];
};

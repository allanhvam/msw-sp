import type { AndFilter, Filter, FilterTarget } from 'eh-odata-parser';
import pkg from 'eh-odata-parser';
import type { DefaultBodyType, DelayMode, PathParams, ResponseResolver, StrictRequest } from 'msw';
import { delay, http } from 'msw';
import type { HttpRequestResolverExtras } from 'msw/lib/core/handlers/HttpHandler.js';
import { TenantMock } from './mocks/TenantMock.js';
import type { Tenant } from './types/Tenant.js';
const { parse } = pkg;

const response = async (response: Response,
    info: { request: StrictRequest<DefaultBodyType> }
) => {

    if (response.status !== 200) {
        return response;
    }

    let json = await response.json();
    const url = info.request.url;

    // OData functions
    type OrFilter = {
        type: "or"
        left: Filter
        right: Filter
    }

    type CompareFilter = {
        type: "gt" | "lt" | "ge" | "le"
        left: FilterTarget
        right: FilterTarget
    }

    const filterObjects = <T>(objects: Array<T>, ast: Filter | AndFilter | OrFilter | CompareFilter): Array<T> => {
        const getTarget = (target: FilterTarget) => {
            return (o: any) => {
                switch (target.type) {
                    case "literal":
                        return target.value;
                    case "property":
                        return o[target.name];
                    case "array":
                        throw new Error("msw-sp: 'array' odata filter not implemented");
                }
            };
        };

        switch (ast.type) {
            case "or": {
                const left = filterObjects(objects, ast.left);
                const right = filterObjects(objects, ast.right);

                return left.concat(right).filter((value, index, array) => {
                    return array.indexOf(value) === index;
                });
            }
            case "and": {
                const left = filterObjects(objects, ast.left);
                const right = filterObjects(objects, ast.right);

                return left.filter(l => right.find(r => r === l));
            }
            case "lt": {
                const left = getTarget(ast.left);
                const right = getTarget(ast.right);

                return objects.filter(o => left(o) < right(o));
            }
            case "le": {
                const left = getTarget(ast.left);
                const right = getTarget(ast.right);

                return objects.filter(o => left(o) <= right(o));
            }
            case "gt": {
                const left = getTarget(ast.left);
                const right = getTarget(ast.right);

                return objects.filter(o => left(o) > right(o));
            }
            case "ge": {
                const left = getTarget(ast.left);
                const right = getTarget(ast.right);

                return objects.filter(o => left(o) >= right(o));
            }
            case "eq": {
                const left = getTarget(ast.left);
                const right = getTarget(ast.right);

                return objects.filter(o => left(o) === right(o));
            }
            default:
                throw new Error(`msw-sp: odata filter operator ${ast.type} not implemented.`);
        }
    };

    const filter = <T>(objects: Array<T> | undefined): Array<T> | undefined => {
        if (!objects) {
            return objects;
        }
        const { search } = new URL(url);
        let uri = decodeURIComponent(search);
        if (uri.indexOf("?") === 0) {
            uri = uri.substring(1);
        }
        // Replace + with space
        uri = uri.replace(/\+/g, " ");
        if (!uri) {
            return objects;
        }
        // Replace datetime'DATE' with DATE
        uri = uri.replace(/datetime'(\S+)'/g, "'$1'");
        const ast = parse(uri);

        if (ast.$filter) {
            return filterObjects(objects || [], ast.$filter);
        }
        return objects;
    };

    const orderBy = <T>(objects: Array<T> | undefined): Array<T> | undefined => {
        if (!objects) {
            return objects;
        }
        const { search } = new URL(url);
        let uri = decodeURIComponent(search);
        if (uri.indexOf("?") === 0) {
            uri = uri.substring(1);
        }
        // Replace + with space
        uri = uri.replace(/\+/g, " ");
        if (!uri) {
            return objects;
        }

        const searchParams = new URLSearchParams(uri);
        if (searchParams.has("$orderby")) {
            let orderBy = searchParams.get("$orderby") ?? "";
            if (orderBy.includes(",")) {
                console.log("msw-sp: odata $orderby only supported on one property");
                orderBy = orderBy.split(",")[0];
            }
            const [property, order] = orderBy.split(" ");
            objects.sort((a, b) => {
                const aValue = a[property];
                const bValue = b[property];
                if (typeof aValue === "number" && typeof bValue === "number") {
                    if (order === "desc") {
                        return bValue - aValue;
                    }
                    return aValue - bValue;
                }
                const aStr: string = aValue?.toString() ?? "";
                const bStr: string = bValue?.toString() ?? "";

                if (order === "desc") {
                    return bStr.localeCompare(aStr);
                }
                return aStr.localeCompare(bStr);
            });
        }

        return objects;
    };

    // Handle OData params
    if (Array.isArray(json)) {
        json = orderBy(filter(json));
    }

    return new Response(
        JSON.stringify(json),
        {
            status: response.status,
            statusText: response.statusText,
        });
};

export const handlers = (options: Tenant | { tenant: Tenant, delay?: DelayMode | number }) => {
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

    const get = (path: string, resolver: ResponseResolver<HttpRequestResolverExtras<PathParams>>) => {
        return [
            http.get(`${tenant.url}/sites/:site${path}`, wrap(resolver)),
            http.get(`${tenant.url}${path}`, wrap(resolver)),
            http.get(`/sites/:site${path}`, wrap(resolver)),
            http.get(`${path}`, wrap(resolver)),
        ];
    };

    const post = (path: string, resolver: ResponseResolver<HttpRequestResolverExtras<PathParams>, DefaultBodyType, undefined>) => {
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
            const title = info.params.title.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).get(), info);
        }),
        ...get(`/_api/web/lists\\(':listId'\\)`, async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).get(), info);
        }),
        ...get(`/_api/web/lists\\(':listId'\\)/fields`, async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).fields.get(), info);
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/fields", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).fields.get(), info);
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).get(), info);
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/forms", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).forms.get(), info);
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/fields", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).fields.get(), info);
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/defaultView/viewfields", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).defaultView.viewFields.get(), info);
        }),
        ...get("/_api/web/getList\\(':listRelativeUrl'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).items.get(), info);
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.get(), info);
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/rootFolder", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).rootFolder.get(), info);
        }),
        ...get("/_api/web/lists\\(':listId'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).items.get(), info);
        }),
        ...get("/_api/web/lists\\(':listId'\\)/rootFolder", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).rootFolder.get(), info);
        }),
        ...get("/_api/web/lists\\(':listId'\\)/forms", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).forms.get(), info);
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/forms", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).forms.get(), info);
        }),
        ...get("/_api/web/lists\\(':listId'\\)/items\\(:itemId\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listId = info.params.listId.toString();
            const itemId = info.params.itemId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getById(listId).items.getById(itemId).get(), info);
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/items\\(:itemId\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            const itemId = info.params.itemId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.getById(itemId).get(), info);
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/EffectiveBasePermissions", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).effectiveBasePermissions.get(), info);
        }),
        ...get("/_api/web/defaultDocumentLibrary", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.defaultDocumentLibrary.get(), info);
        }),
        ...get("/_api/web/defaultDocumentLibrary/EffectiveBasePermissions", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.defaultDocumentLibrary.effectiveBasePermissions.get(), info);
        }),
        ...get("/_api/web/defaultDocumentLibrary/rootFolder", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.defaultDocumentLibrary.rootFolder.get(), info);
        }),
        ...get("/_api/web/defaultDocumentLibrary/getitems", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.defaultDocumentLibrary.items.get(), info);
        }),
        ...get("/_api/web/EffectiveBasePermissions", async (info) => {
            const site = info.params.site?.toString() || "/";
            return response(await tenantMock.sites.getSite(site).rootWeb.effectiveBasePermissions.get(), info);
        }),
        ...get("/_api/web/lists/getByTitle\\(':title'\\)/items\\(:itemId\\)/EffectiveBasePermissions", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            const itemId = info.params.itemId.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.getById(itemId).effectiveBasePermissions.get(), info);
        }),
        ...get("/_api/web/regionalSettings/timezone", async (info) => {
            return response(new Response(JSON.stringify({
                "Description": "(UTC+01:00) Brussels, Copenhagen, Madrid, Paris",
                "Id": 3,
                "Information": {
                    "Bias": -60,
                    "DaylightBias": -60,
                    "StandardBias": 0
                }
            }), { status: 200 }), info);
        }),
        ...get("/_api/web/siteUsers/getById\\(:id\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const id = info.params.id.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.siteUsers.getById(id).get(), info);
        }),
        ...get("/_api/*", async (info) => {
            return response(new Response(undefined, { status: 501, statusText: "Not Implemented (GET)" }), info);
        }),

        // MARK: POST
        ...post("/_api/sp.ui.applicationpages.clientpeoplepickerwebserviceinterface.clientpeoplepickersearchuser", async (info) => {
            const payload = info.request.json();
            return response(tenantMock.clientPeoplePickerSearchUser(payload), info);
        }),
        ...post("/_api/web/ensureuser", async (info) => {
            const site = info.params.site?.toString() || "/";
            const payload = await info.request.json() as any;
            return response(tenantMock.sites.getSite(site).rootWeb.ensureUser(payload), info);
        }),
        ...post("/_api/web/lists", async (info) => {
            const site = info.params.site?.toString() || "/";
            const payload = await info.request.json() as any;
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.post(payload), info);
        }),
        ...post("/_api/web/getList\\(':listRelativeUrl'\\)/getitems", async (info) => {
            const site = info.params.site?.toString() || "/";
            const listRelativeUrl = info.params.listRelativeUrl.toString();
            return response(await tenantMock.sites.getSite(site).rootWeb.getList(listRelativeUrl).items.get(), info);
        }),
        ...post("/_api/web/lists/getByTitle\\(':title'\\)/items", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            const payload = await info.request.json();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.post(payload), info);
        }),
        ...post("/_api/web/lists/getByTitle\\(':title'\\)/items\\(:id\\)", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            const id = info.params.id.toString();

            if (info.request.headers.get("x-http-method") === "DELETE") {
                return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.getById(id).delete(), info);
            }

            const payload = await info.request.json();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.getById(id).post(payload), info);
        }),
        ...post("/_api/web/lists/getByTitle\\(':title'\\)/items\\(:id\\)/validateupdatelistitem", async (info) => {
            const site = info.params.site?.toString() || "/";
            const title = info.params.title.toString();
            const id = info.params.id.toString();
            const payload = await info.request.json();
            return response(await tenantMock.sites.getSite(site).rootWeb.lists.getByTitle(title).items.getById(id).validateUpdateListItem(payload), info);
        }),
        ...post("/_api/*", async (...params) => {
            return response(new Response(undefined, { status: 501, statusText: "Not Implemented (POST)" }), ...params);
        }),
    ];
};
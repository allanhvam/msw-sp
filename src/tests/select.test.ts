import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/items/index.js";
import "@pnp/sp/lists/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from "msw/node";
import * as assert from "node:assert";
import { after, describe, test } from "node:test";
import { handlers } from "../handlers.js";

void describe("select", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
            "select": {
                rootWeb: {
                    title: "Select Site",
                    serverRelativeUrl: "/sites/select",
                    lists: [{
                        title: "List",
                        baseTemplate: 100,
                        url: "lists/list",
                        items: [
                            { Id: 1, Title: "Charlie", Expiration: "2026-11-01T00:00:00Z" },
                            { Id: 2, Title: "Alpha", Expiration: null },
                            { Id: 3, Title: "Bravo", Expiration: "2026-12-01T00:00:00Z" },
                        ],
                    }],
                },
            },
        },
    }));
    server.listen({ onUnhandledRequest: "error" });
    after(() => server.close());

    const getList = () => {
        const sp = spfi().using(SPFx({
            pageContext: {
                web: { absoluteUrl: `${url}/sites/select` },
                legacyPageContext: {
                    formDigestTimeoutSeconds: 60,
                    formDigestValue: "digest",
                },
            },
        }));
        return sp.web.lists.getByTitle("List");
    };

    await test("returns only selected fields for item collections", async () => {
        const items = await getList().items.select("Title", "Expiration")();

        assert.deepStrictEqual(items, [
            { Title: "Charlie", Expiration: "2026-11-01T00:00:00Z" },
            { Title: "Alpha", Expiration: null },
            { Title: "Bravo", Expiration: "2026-12-01T00:00:00Z" },
        ]);
    });

    await test("returns only selected fields for a single item", async () => {
        const item = await getList().items.getById(1).select("Title", "Expiration")();

        assert.deepStrictEqual(item, {
            Title: "Charlie",
            Expiration: "2026-11-01T00:00:00Z",
        });
    });

    await test("applies selection after filtering, ordering, and top", async () => {
        const items = await getList().items.select("Expiration")
            .filter("Id gt 1").orderBy("Title", false).top(1)();

        assert.deepStrictEqual(items, [{ Expiration: "2026-12-01T00:00:00Z" }]);
    });

    await test("wildcard and absent select return all fields without mutating items", async () => {
        const expected = {
            Id: 1,
            ID: 1,
            Title: "Charlie",
            Expiration: "2026-11-01T00:00:00Z",
        };
        await getList().items.getById(1).select("Title")();

        assert.deepStrictEqual(await getList().items.getById(1)(), expected);
        assert.deepStrictEqual(await getList().items.getById(1).select("*")(), expected);
        assert.deepStrictEqual(await getList().items.getById(1).select("*", "Title")(), expected);
    });

    await test("omits fields absent from mock data", async () => {
        const item = await getList().items.getById(1).select("Title", "Missing")();

        assert.deepStrictEqual(item, { Title: "Charlie" });
    });

    await test("preserves empty collections", async () => {
        const items = await getList().items.filter("Id eq 404").select("Title")();

        assert.deepStrictEqual(items, []);
    });

    await test("preserves missing-item responses", async () => {
        const result = await fetch(`${url}/sites/select/_api/web/lists/getByTitle('List')/items(404)?$select=Title`);

        assert.equal(result.status, 404);
    });
});
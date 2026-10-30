import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/items/index.js";
import "@pnp/sp/lists/index.js";
import "@pnp/sp/site-users/index.js";
import "@pnp/sp/sites/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from 'msw/node';
import * as assert from "node:assert";
import { describe, test } from "node:test";
import { handlers } from '../handlers.js';

void describe("items", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
            "items": {
                rootWeb: {
                    title: "Items Site",
                    serverRelativeUrl: "/sites/items",
                    lists: [
                        {
                            title: "List",
                            baseTemplate: 100,
                            url: "lists/list",
                            items: [
                            ],
                            created: "2023-03-21T11:21:08Z",
                        },
                        {
                            title: "Top",
                            baseTemplate: 100,
                            url: "lists/top",
                            items: [
                                { Id: 1, Title: "Charlie" },
                                { Id: 2, Title: "Alpha" },
                                { Id: 3, Title: "Bravo" },
                            ],
                        },
                    ],
                },
            },
        },
    }));
    server.listen();

    const getContext = (serverRelativeUrl: string) => {
        return {
            pageContext: {
                web: {
                    absoluteUrl: `${url}${serverRelativeUrl}`,
                },
                legacyPageContext: {
                    formDigestTimeoutSeconds: 60,
                    formDigestValue: "digest",
                },
            },
        };
    };

    await test("crud", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/items")));

        const list = sp.web.lists.getByTitle("List");

        let items = await list.items();
        assert.equal(items.length, 0);

        // Add
        await list.items.add({ Title: "New" });

        items = await list.items();
        assert.equal(items.length, 1);
        assert.equal(items[0].Id, 1);
        assert.equal(items[0].Title, "New");

        // Update
        await list.items.getById(items[0].Id).update({ Title: "New update" });

        items = await list.items();
        assert.equal(items.length, 1);
        assert.equal(items[0].Title, "New update");

        // ValidateUpdateListItem
        const formValues = [
            {
                FieldName: "Title",
                FieldValue: `New validateUpdateListItem`,
            },
        ];
        await list.items.getById(items[0].Id).validateUpdateListItem(formValues);

        items = await list.items();
        assert.equal(items.length, 1);
        assert.equal(items[0].Title, "New validateUpdateListItem");

        // Delete
        await list.items.getById(items[0].Id).delete();

        items = await list.items();
        assert.equal(items.length, 0);
    });

    await test("top limits items without changing subsequent requests", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/items")));
        const list = sp.web.lists.getByTitle("Top");

        const items = await list.items.top(1)();

        assert.deepStrictEqual(items.map(item => item.Id), [1]);
        assert.equal((await list.items()).length, 3);
    });

    await test("top zero returns no items", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/items")));

        const items = await sp.web.lists.getByTitle("Top").items.top(0)();

        assert.deepStrictEqual(items, []);
    });

    await test("top above item count returns all items", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/items")));

        const items = await sp.web.lists.getByTitle("Top").items.top(100)();

        assert.deepStrictEqual(items.map(item => item.Id), [1, 2, 3]);
    });

    await test("top is applied after filtering and ordering", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/items")));

        const items = await sp.web.lists.getByTitle("Top").items
            .filter("Id gt 1").orderBy("Title", false).top(1)();

        assert.deepStrictEqual(items.map(item => item.Id), [3]);
    });

    await test("invalid top values return 400", async () => {
        for (const top of ["-1", "1.5", "invalid", "", "9007199254740992"]) {
            const result = await fetch(`${url}/sites/items/_api/web/lists/getByTitle('Top')/items?$top=${top}`);

            assert.equal(result.status, 400);
        }
    });

    await test("items, async Iterator", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/items")));

        const list = sp.web.lists.getByTitle("List");

        const items = await list.items();
        assert.equal(items.length, 0);

        // Add
        for (let i = 0; i !== 55; i++) {
            await list.items.add({ Title: `New ${i}` });
        }

        let array = new Array();
        for await (const page of list.items) {
            array = array.concat(page);
        }

        assert.equal(array.length, 55);
    });
});
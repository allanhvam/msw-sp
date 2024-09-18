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
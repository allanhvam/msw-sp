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

void describe("order-by", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
            "order-by": {
                rootWeb: {
                    title: "Order By Site",
                    serverRelativeUrl: "/sites/order-by",
                    lists: [
                        {
                            title: "A",
                            id: "fbb09f76-1c18-48eb-84c2-aae912236dea",
                            baseTemplate: 100,
                            url: "lists/a",
                            items: [
                                {
                                    "Title": "0",
                                },
                                {
                                    "Title": "1",
                                },
                            ],
                        },
                        {
                            title: "B",
                            id: "22f06a14-17d2-4ded-bccc-67515c2d43f4",
                            baseTemplate: 100,
                            url: "lists/a",
                            items: [
                                {
                                    "Title": "0",
                                },
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

    await test("orderBy ASC", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/order-by")));

        const lists = await sp.web.lists.orderBy("Title")();

        assert.equal(lists.length, 2);
        assert.equal(lists[0].Title, "A");
        assert.equal(lists[1].Title, "B");
    });

    await test("orderBy DESC", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/order-by")));

        const lists = await sp.web.lists.orderBy("Title", false)();

        assert.equal(lists.length, 2);
        assert.equal(lists[0].Title, "B");
        assert.equal(lists[1].Title, "A");
    });

    await test("orderBy number ASC", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/order-by")));

        const lists = await sp.web.lists.orderBy("ItemCount")();

        assert.equal(lists.length, 2);
        assert.equal(lists[0].Title, "B");
        assert.equal(lists[1].Title, "A");
    });

    await test("orderBy number DESC", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/order-by")));

        const lists = await sp.web.lists.orderBy("ItemCount", false)();

        assert.equal(lists.length, 2);
        assert.equal(lists[0].Title, "A");
        assert.equal(lists[1].Title, "B");
    });
});
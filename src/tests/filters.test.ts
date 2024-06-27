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

void describe("filters", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
            "filter": {
                rootWeb: {
                    title: "Filter Site",
                    serverRelativeUrl: "/sites/filter",
                    lists: [
                        {
                            title: "Filters",
                            id: "e3df5114-acc5-4901-8eb8-c55200d963d3",
                            baseTemplate: 100,
                            url: "lists/filters",
                            items: [
                                {
                                    Title: "Filter 1"
                                }
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

    await test("eq", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Title eq 'Filters'")();

        assert.equal(lists.length, 1);
    });

    await test("gt", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount gt 0")();

        assert.equal(lists.length, 1);
    });

    await test("ge", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount ge 1")();

        assert.equal(lists.length, 1);
    });

    await test("lt datetime", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter(`Created lt datetime'${new Date().toISOString()}'`)();

        assert.equal(lists.length, 1);
    });

    await test("gt datetime", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter(`Created gt datetime'2020-01-01T12:00:00Z'`)();

        assert.equal(lists.length, 1);
    });
});
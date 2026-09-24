import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/items/index.js";
import "@pnp/sp/lists/index.js";
import "@pnp/sp/site-users/index.js";
import "@pnp/sp/sites/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from "msw/node";
import * as assert from "node:assert";
import { describe, test } from "node:test";
import { handlers } from "../handlers.js";

void describe("filters", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(
        ...handlers({
            title: "tenant",
            url,
            sites: {
                filter: {
                    rootWeb: {
                        title: "Filter Site",
                        serverRelativeUrl: "/sites/filter",
                        lists: [
                            {
                                title: "Filters",
                                id: "e3df5114-acc5-4901-8eb8-c55200d963d3",
                                baseTemplate: 100,
                                url: "lists/filters",
                                hidden: false,
                                items: [
                                    {
                                        Title: "Filter 1",
                                    },
                                ],
                                created: "2023-03-21T11:21:08Z",
                            },
                            {
                                title: "Empty",
                                id: "af763d40-0307-4643-a52a-1301485c8cf6",
                                baseTemplate: 100,
                                url: "lists/empty",
                                hidden: false,
                                items: [],
                                created: "2020-01-01T12:00:00Z",
                            },
                            {
                                title: "Full",
                                id: "3a61a974-9d07-4644-973f-7dd68ff02947",
                                baseTemplate: 100,
                                url: "lists/full",
                                hidden: true,
                                items: [
                                    {
                                        Title: "First",
                                        CategoryId: 5,
                                        Category: { Title: "Hardware" },
                                    },
                                    {
                                        Title: "Second",
                                        CategoryId: 9,
                                        Category: { Title: "Software" },
                                    },
                                ],
                                created: "2024-01-01T12:00:00Z",
                            },
                        ],
                    },
                },
            },
        })
    );
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

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("le includes boundary", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount le 1")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Empty"]
        );
    });

    await test("ge", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount ge 1")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Full"]
        );
    });

    await test("lt datetime", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Created lt datetime'2023-03-21T11:21:08Z'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Empty"]
        );
    });

    await test("gt datetime", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter(`Created gt datetime'2020-01-01T12:00:00Z'`)();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Full"]
        );
    });

    await test("eq numeric zero", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount eq 0")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Empty"]
        );
    });

    await test("eq no match", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Title eq 'Missing'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            []
        );
    });

    await test("startswith filters by title prefix", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("startswith(Title,'Fil')")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("substringof filters by title fragment", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("substringof('ull',Title)")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Full"]
        );
    });

    await test("ne excludes matching title", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Title ne 'Empty'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Full"]
        );
    });

    await test("boolean true matches hidden lists", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Hidden eq true")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Full"]
        );
    });

    await test("boolean false matches visible lists", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Hidden eq false")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Empty"]
        );
    });

    await test("filters list items by field", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const items = await sp.web.lists.getByTitle("Full").items.filter("Title eq 'Second'")();

        assert.deepEqual(
            items.map((item) => item.Title),
            ["Second"]
        );
    });

    await test("filters list items by lookup ID", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const items = await sp.web.lists.getByTitle("Full").items.filter("CategoryId eq 9")();

        assert.deepEqual(
            items.map((item) => item.Title),
            ["Second"]
        );
    });

    await test("filters list items by lookup value", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const items = await sp.web.lists
            .getByTitle("Full")
            .items.filter("Category/Title eq 'Hardware'")();

        assert.deepEqual(
            items.map((item) => item.Title),
            ["First"]
        );
    });

    await test("gt excludes boundary", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount gt 1")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Full"]
        );
    });

    await test("ge includes zero", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount ge 0")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Empty", "Full"]
        );
    });

    await test("lt excludes boundary", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount lt 1")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Empty"]
        );
    });

    await test("lt no match", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount lt 0")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            []
        );
    });

    await test("eq datetime", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Created eq datetime'2023-03-21T11:21:08Z'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("day filters by UTC day", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("day(Created) eq 21")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("month filters by UTC month", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("month(Created) eq 3")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("year filters by UTC year", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("year(Created) eq 2020")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Empty"]
        );
    });

    await test("hour filters by UTC hour", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("hour(Created) eq 11")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("minute filters by UTC minute", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("minute(Created) eq 21")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("second filters by UTC second", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("second(Created) eq 8")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("ge datetime includes boundary", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Created ge datetime'2023-03-21T11:21:08Z'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Full"]
        );
    });

    await test("le datetime includes boundary", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Created le datetime'2023-03-21T11:21:08Z'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Empty"]
        );
    });

    await test("and intersects matches", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount gt 0 and ItemCount lt 2")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters"]
        );
    });

    await test("parentheses group or before and", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter(
            "(Title eq 'Empty' or ItemCount eq 2) and ItemCount gt 0"
        )();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Full"]
        );
    });

    await test("and returns no matches", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Title eq 'Empty' and ItemCount gt 0")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            []
        );
    });

    await test("or combines matches", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("Title eq 'Empty' or Title eq 'Full'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Empty", "Full"]
        );
    });

    await test("or deduplicates matches", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/filter")));

        const lists = await sp.web.lists.filter("ItemCount ge 1 or Title eq 'Filters'")();

        assert.deepEqual(
            lists.map((list) => list.Title),
            ["Filters", "Full"]
        );
    });
});

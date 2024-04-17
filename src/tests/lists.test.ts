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

void describe("lists", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
            "empty": {
                rootWeb: {
                    title: "Empty Site",
                    serverRelativeUrl: "/sites/empty",
                    lists: [
                        {
                            title: "Empty",
                            baseTemplate: 100,
                            url: "Lists/Empty",
                            items: [],
                        },
                    ],
                },
            },
            "events": {
                rootWeb: {
                    title: "Events Site",
                    serverRelativeUrl: "/sites/events",
                    lists: [
                        {
                            title: "Events",
                            baseTemplate: 106,
                            url: "Lists/Events",
                            items: [
                                {
                                    "FileSystemObjectType": 0,
                                    "Id": 1,
                                    "ContentTypeId": "0x0100EE277107DD3E9F4CBC7D33048BB8CB92",
                                    "Title": "Event",
                                    "Start": "2024-04-22T06:00:00Z",
                                    "End": "2024-04-22T14:00:00Z",
                                    "ID": 457,
                                    "Modified": "2024-01-04T11:56:54Z",
                                    "Created": "2023-10-10T06:01:48Z",
                                    "AuthorId": 1073741822,
                                    "EditorId": 1073741822,
                                }
                            ]
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

    await test("404", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/empty")));

        await assert.rejects(async () => {
            await sp.web.lists.getByTitle("404")();
        });

        await assert.rejects(async () => {
            await sp.web.lists.getByTitle("404").items();
        });
    });

    await test("empty", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/empty")));

        const list = await sp.web.lists.getByTitle("Empty")();
        assert.equal(list.Title, "Empty");
        const items = await sp.web.lists.getByTitle("Empty").items();
        assert.equal(items.length, 0);
    });

    await test("events", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/events")));

        const events = await sp.web.getList("/sites/events/lists/events").items();
        assert.equal(events.length, 1);
        const event = events[0];
        assert.equal(event["Title"], "Event");
    });
});
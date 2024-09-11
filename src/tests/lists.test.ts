import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/fields/index.js";
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
                            id: "e3df5114-acc5-4901-8eb8-c55200d963d3",
                            baseTemplate: 100,
                            url: "Lists/Empty",
                            items: [],
                        },
                    ],
                },
            },
            "defaultDocumentLibrary": {
                rootWeb: {
                    title: "defaultDocumentLibrary Site",
                    serverRelativeUrl: "/sites/defaultDocumentLibrary",
                    lists: [
                        {
                            title: "Documents",
                            id: "4b3dad0c-7bc9-463c-acb6-37c1c6f7498f",
                            baseTemplate: 101,
                            url: "Lists/Documents",
                            items: [],
                            isDefaultDocumentLibrary: true,
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
                                    "ID": 1,
                                    "Modified": "2023-01-04T11:56:54Z",
                                    "Created": "2023-01-01T06:01:48Z",
                                    "AuthorId": 1073741822,
                                    "EditorId": 1073741822,
                                },
                                {
                                    "FileSystemObjectType": 0,
                                    "Id": 2,
                                    "ContentTypeId": "0x0100EE277107DD3E9F4CBC7D33048BB8CB92",
                                    "Title": "Event 2",
                                    "Start": "2024-04-23T06:00:00Z",
                                    "End": "2024-04-23T14:00:00Z",
                                    "ID": 2,
                                    "Modified": "2024-01-04T11:56:54Z",
                                    "Created": "2024-01-01T06:01:48Z",
                                    "AuthorId": 1073741822,
                                    "EditorId": 1073741822,
                                },
                                {
                                    "FileSystemObjectType": 0,
                                    "Id": 3,
                                    "ContentTypeId": "0x0100EE277107DD3E9F4CBC7D33048BB8CB92",
                                    "Title": "Event 3",
                                    "Start": "2024-04-24T06:00:00Z",
                                    "End": "2024-04-24T14:00:00Z",
                                    "ID": 2,
                                    "Modified": "2022-01-04T11:56:54Z",
                                    "Created": "2022-01-01T06:01:48Z",
                                    "AuthorId": 1073741822,
                                    "EditorId": 1073741822,
                                },
                            ],
                            fields: [
                                {
                                    title: "Id",
                                    internalName: "ID",
                                    typeAsString: "Counter",
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

        const emptyLists = [
            sp.web.lists.getByTitle("Empty"),
            sp.web.lists.getById("e3df5114-acc5-4901-8eb8-c55200d963d3"),
        ];

        for (const emptyList of emptyLists) {
            const emptyListInfo = await emptyList();
            assert.equal(emptyListInfo.Title, "Empty");
            assert.equal(emptyListInfo.ItemCount, 0);
            assert.equal(emptyListInfo.LastItemModifiedDate, new Date(0).toISOString());
            const items = await emptyList.items();
            assert.equal(items.length, 0);
        }
    });

    await test("events", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/events")));

        const eventList = sp.web.getList("/sites/events/lists/events");
        const eventListInfo = await eventList();
        const events = await eventList.items();
        assert.equal(events.length, 3);
        const event = events[0];
        assert.equal(event["Title"], "Event");

        assert.equal(eventListInfo.LastItemModifiedDate, "2024-01-04T11:56:54Z");
    });

    await test("add", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/events")));

        const title = new Date().getTime().toString();
        const listInfo = await sp.web.lists.add(title, "Description", 100, true, {
            NoCrawl: true,
        });

        assert.equal(listInfo.Title, title);

        const lists = await sp.web.lists();
        const list = lists.find(l => l.Title === title);
        assert.ok(list);
        assert.equal(list.Description, "Description");
        assert.equal(list.BaseTemplate, 100);
        assert.equal(list.ContentTypesEnabled, true);
        assert.equal(list.NoCrawl, true);
    });

    await test("fields", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/events")));

        const eventList = sp.web.lists.getByTitle("Events");
        const fields = await eventList.fields.select("InternalName")();
        assert.equal(fields.length, 1);
        const field = fields[0];
        assert.equal(field.InternalName, "ID");
    });

    await test("defaultDocumentLibrary", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/defaultDocumentLibrary")));

        const list = await sp.web.defaultDocumentLibrary();

        assert.equal(list["IsDefaultDocumentLibrary"], true);
    });
});
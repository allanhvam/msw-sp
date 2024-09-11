import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/fields/index.js";
import "@pnp/sp/files/index.js";
import "@pnp/sp/folders/index.js";
import "@pnp/sp/items/index.js";
import "@pnp/sp/lists/index.js";
import "@pnp/sp/site-users/index.js";
import "@pnp/sp/sites/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from 'msw/node';
import assert from "node:assert";
import { describe, test } from "node:test";
import { handlers } from '../handlers.js';

void describe("files", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
            "files": {
                rootWeb: {
                    title: "Files Site",
                    serverRelativeUrl: "/sites/files",
                    lists: [
                        {
                            title: "Documents",
                            id: "c4a8690d-678f-47c9-a1b1-7fb0837254a1",
                            baseTemplate: 101,
                            url: "Lists/Documents",
                            isDefaultDocumentLibrary: true,
                            items: [],
                            rootFolder: {
                                files: [
                                    {
                                        uniqueId: "7d131b18-9ff1-43e5-9c76-42ee9958088d",
                                        name: "Package.txt",
                                        content: "msw-sp",
                                    },
                                ]
                            }
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

    await test("files", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/files")));

        const files = await sp.web.defaultDocumentLibrary.rootFolder.files();
        assert.ok(files);
        assert.equal(files.length, 1);
        assert.equal(files[0].Name, "Package.txt");
    });
});
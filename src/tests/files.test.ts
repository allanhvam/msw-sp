import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/fields/index.js";
import "@pnp/sp/files/index.js";
import "@pnp/sp/folders/index.js";
import "@pnp/sp/items/index.js";
import "@pnp/sp/lists/index.js";
import "@pnp/sp/site-users/index.js";
import "@pnp/sp/sites/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from "msw/node";
import assert from "node:assert";
import { describe, test } from "node:test";
import { handlers } from "../handlers.js";

void describe("files", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(
        ...handlers({
            title: "tenant",
            url,
            sites: {
                files: {
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
                                            listItemAllFields: { Title: "Package" },
                                        },
                                        {
                                            name: "index.txt",
                                            content: JSON.stringify({ entries: ["Ada"] }),
                                        },
                                    ],
                                    folders: [
                                        {
                                            name: "Archive",
                                            files: [{ name: "older.txt", content: "older" }],
                                        },
                                    ],
                                },
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

    await test("files", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/files")));

        const fileInfos = await sp.web.defaultDocumentLibrary.rootFolder.files();
        assert.ok(fileInfos);
        assert.equal(fileInfos.length, 2);
        let fileInfo = fileInfos[0];
        assert.equal(fileInfo.UniqueId, "7d131b18-9ff1-43e5-9c76-42ee9958088d");
        assert.equal(fileInfo.Name, "Package.txt");

        const file = sp.web.getFileById(fileInfo.UniqueId);
        fileInfo = await file();
        assert.equal(fileInfo.Name, "Package.txt");

        const exists = await file.exists();
        assert.ok(exists);
    });

    await test("site root web and list index file content", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/files")));
        const rootWeb = sp.site.rootWeb;

        assert.equal((await rootWeb()).Title, "Files Site");
        const list = rootWeb.getList("/sites/files/Lists/Documents");
        assert.deepEqual(await list.rootFolder.files.getByUrl("index.txt").getJSON(), {
            entries: ["Ada"],
        });
        await assert.rejects(list.rootFolder.files.getByUrl("missing.txt").getJSON(), /404/);
        await assert.rejects(
            rootWeb
                .getList("/sites/files/Lists/Missing")
                .rootFolder.files.getByUrl("index.txt")
                .getJSON(),
            /404/
        );
    });

    await test("list files, metadata, server-relative path, and deletion", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/files")));
        const files = sp.site.rootWeb.getList("/sites/files/Lists/Documents").rootFolder.files;

        assert.equal((await files()).length, 2);
        assert.equal((await files.getByUrl("index.txt")()).Name, "index.txt");
        assert.deepEqual(await files.getByUrl("Package.txt").listItemAllFields(), {
            Title: "Package",
        });
        assert.equal(
            (
                await sp.web.getFileByServerRelativePath(
                    "/sites/files/Lists/Documents/Archive/older.txt"
                )()
            ).Name,
            "older.txt"
        );
        assert.equal(
            await sp.web
                .getFileByServerRelativePath("/sites/files/Lists/Documents/Archive/older.txt")
                .getText(),
            "older"
        );
        await assert.rejects(
            sp.web.getFileByServerRelativePath(
                "/sites/files/Lists/Documents/Archive/missing.txt"
            )(),
            /404/
        );
        await files.getByUrl("index.txt").delete();
        assert.equal((await files()).length, 1);
        await assert.rejects(files.getByUrl("index.txt")(), /404/);
    });

    await test("chunked text upload", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/files")));
        const files = sp.site.rootWeb.getList("/sites/files/Lists/Documents").rootFolder.files;
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('{"entries":'));
                controller.enqueue(new TextEncoder().encode('["Grace"]}'));
                controller.close();
            },
        });

        await files.addChunked("new-index.txt", stream);
        assert.deepEqual(await files.getByUrl("new-index.txt").getJSON(), { entries: ["Grace"] });
        assert.equal((await files()).length, 2);
    });

    await test("missing site root web", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/missing")));
        await assert.rejects(sp.site.rootWeb(), /404/);
    });
});

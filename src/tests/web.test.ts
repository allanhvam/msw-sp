import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/site-users/index.js";
import "@pnp/sp/sites/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from "msw/node";
import * as assert from "node:assert";
import { describe, test } from "node:test";
import { personPlaceholder } from "../assets/people-placeholder.js";
import { handlers } from "../handlers.js";

void describe("web", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(
        ...handlers({
            title: "tenant",
            url,
            sites: {
                "/": {
                    rootWeb: {
                        title: "Root",
                        serverRelativeUrl: "/",
                    },
                },
                "web-title": {
                    rootWeb: {
                        title: "Title",
                        serverRelativeUrl: "/sites/web-title",
                    },
                },
                "web-ensureUser": {
                    users: [
                        {
                            id: 1,
                            title: "User",
                            loginName: "user@tenant.onmicrosoft.com",
                        },
                    ],
                    rootWeb: {
                        title: "Title",
                        serverRelativeUrl: "/sites/web-ensureUser",
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

    await test("title", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/web-title")));

        const webInfo = await sp.web();

        assert.equal(webInfo.Title, "Title");
    });

    await test("user photo returns the placeholder for existing sites", async () => {
        for (const path of ["", "/sites/web-title"]) {
            const photo = await fetch(`${url}${path}/_layouts/15/userphoto.aspx`);

            assert.equal(photo.status, 200);
            assert.equal(photo.headers.get("content-type"), "image/png");

            const image = Buffer.from(await photo.arrayBuffer());
            assert.deepStrictEqual(image, Buffer.from(personPlaceholder, "base64"));
        }
    });

    await test("user photo returns 404 for missing sites", async () => {
        const photo = await fetch(`${url}/sites/404/_layouts/15/userphoto.aspx`);

        assert.equal(photo.status, 404);
        assert.equal(await photo.text(), "");
    });

    await test("ensureUser", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/web-ensureUser")));

        const result = await sp.web.ensureUser("user@tenant.onmicrosoft.com");

        assert.equal(result.Id, 1);
        assert.equal(result.Title, "User");
    });
});

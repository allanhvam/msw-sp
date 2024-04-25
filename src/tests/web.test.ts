import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/site-users/index.js";
import "@pnp/sp/sites/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from 'msw/node';
import * as assert from "node:assert";
import { describe, test } from "node:test";
import { handlers } from '../handlers.js';

void describe("web", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
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
                    }
                ],
                rootWeb: {
                    title: "Title",
                    serverRelativeUrl: "/sites/web-ensureUser",
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

    await test("title", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/web-title")));

        const webInfo = await sp.web();

        assert.equal(webInfo.Title, "Title");
    });

    await test("ensureUser", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/web-ensureUser")));

        const result = await sp.web.ensureUser("user@tenant.onmicrosoft.com");

        assert.equal(result.Id, 1);
        assert.equal(result.Title, "User");
    });
});
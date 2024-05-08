import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/webs/index.js";
import { setupServer } from 'msw/node';
import assert from "node:assert";
import { describe, test } from "node:test";
import { handlers } from '../handlers.js';

void describe("delay", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        tenant: {
            title: "tenant",
            url,
            sites: {
                "delay": {
                    rootWeb: {
                        title: "Title",
                        serverRelativeUrl: "/sites/delay",
                    },
                },
            },
        },
        delay: 500,
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

    await test("500ms", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/delay")));

        const start = new Date();
        await sp.web();
        const end = new Date();
        const duration = end.getTime() - start.getTime();

        assert(duration >= 500);
    });
});
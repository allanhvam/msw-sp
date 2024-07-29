import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/fields/index.js";
import "@pnp/sp/forms/index.js";
import "@pnp/sp/items/index.js";
import "@pnp/sp/lists/index.js";
import "@pnp/sp/site-users/index.js";
import "@pnp/sp/sites/index.js";
import "@pnp/sp/webs/index.js";
import { setupServer } from 'msw/node';
import * as assert from "node:assert";
import { describe, test } from "node:test";
import { handlers } from '../handlers.js';
import { PageType } from "../types/List.js";

void describe("forms", async () => {
    const url = "https://tenant.sharepoint.com";
    const server = setupServer(...handlers({
        title: "tenant",
        url,
        sites: {
            "forms": {
                rootWeb: {
                    title: "Forms Site",
                    serverRelativeUrl: "/sites/forms",
                    lists: [
                        {
                            title: "Forms",
                            baseTemplate: 100,
                            url: "Lists/Forms",
                            items: [
                            ],
                            forms: [
                                {
                                    formType: PageType.DisplayForm,
                                    serverRelativeUrl: "/sites/forms/Lists/forms/DispForm.aspx",
                                },
                            ]
                        },
                        {
                            id: "4e319fc6-3da4-4bcb-87fc-67446cf10aa7",
                            title: "Default",
                            baseTemplate: 100,
                            items: [],
                            url: "lists/default",
                        }
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

    await test("forms", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/forms")));

        const list = sp.web.getList("/sites/forms/lists/forms");
        const forms = await list.forms();

        assert.equal(forms.length, 1);
        const form = forms[0];

        assert.equal(form.FormType, PageType.DisplayForm);
        assert.equal(form.ServerRelativeUrl, "/sites/forms/Lists/forms/DispForm.aspx");
    });

    await test("default", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/forms")));

        const list = sp.web.lists.getByTitle("Default");
        const forms = await list.forms();

        assert.ok(forms.length > 0);
        const displayForm = forms.find(form => form.FormType === PageType.DisplayForm);

        assert.ok(displayForm);
    });

    await test("default getById", async () => {
        const sp = spfi().using(SPFx(getContext("/sites/forms")));

        const list = sp.web.lists.getById("4e319fc6-3da4-4bcb-87fc-67446cf10aa7");
        const forms = await list.forms();

        assert.ok(forms.length > 0);
        const displayForm = forms.find(form => form.FormType === PageType.DisplayForm);

        assert.ok(displayForm);
    });
});
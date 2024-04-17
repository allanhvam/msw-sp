import type { Tenant } from "../types/Tenant.js";
import { SitesMock } from "./SitesMock.js";

/**
 * @internal
 */
export class TenantMock {
    constructor(private tenant: Tenant) {
    }

    public get sites() {
        return new SitesMock(this.tenant.sites);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clientPeoplePickerSearchUser(queryParams: any) {
        const site = this.tenant.sites[""] || this.tenant.sites["/"];

        const value = site.users?.map(u => {
            const email = u.loginName?.split("|")[2];
            return {
                "Key": u.loginName,
                "DisplayText": u.title,
                "IsResolved": true,
                "Description": email,
                "EntityType": "User",
                "EntityData": {
                    "IsAltSecIdPresent": "False",
                    "UserKey": u.loginName,
                    "Title": "Job Title",
                    "Email": email,
                    "MobilePhone": "+4511223344",
                    "ObjectId": "b8d5deb0-0800-4077-a7ea-54033cb61fbc",
                    "Department": "Department"
                },
                "MultipleMatches": [],
                "ProviderName": "Tenant",
                "ProviderDisplayName": "Tenant"
            };
        });

        return new Response(
            JSON.stringify({
                value: JSON.stringify(value),
            }), { status: 200 }
        );
    }
}
import type { Site } from "../types/Site.js";
import { SiteMock } from "./SiteMock.js";

/**
 * @internal
 */
export class SitesMock {
    constructor(private sites?: Record<string, Site>) {
    }

    getSite = (path: string) => {
        if (!path) {
            return new SiteMock(this.sites?.[""] || this.sites?.["/"]);
        }
        return new SiteMock(this.sites?.[path]);
    };
}
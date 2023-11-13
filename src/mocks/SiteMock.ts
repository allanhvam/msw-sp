import type { Site } from "../types/Site.js";
import { WebMock } from "./WebMock.js";

/**
 * @internal
 */
export class SiteMock {
    constructor(private site?: Site) {
    }

    public get rootWeb() {
        return new WebMock(Object.assign({ parent: this.site }, this.site?.rootWeb));
    }
}
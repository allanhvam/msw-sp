import type { Site } from "./Site.js";

export type Tenant = {
    title: string;
    url: string;
    sites: Record<string, Site>;
}
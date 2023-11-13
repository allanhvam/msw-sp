import type { ContentType } from "./ContentType.js";
import type { Field } from "./Field.js";
import type { View } from "./View.js";

export type List = {
    title: string;
    url: string;
    id?: string;
    fields?: Array<Field>;
    views?: Array<View>;
    contentTypes?: Array<ContentType>;
    hidden?: boolean;
} & (GenericList | SitePagesList);

// https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-wssts/8bf797af-288c-4a1d-a14b-cf5394e636cf
export type GenericList = {
    /**
     * 100 GenericList Custom list
     * 101 DocumentLibrary
     * 106 Events
     */
    baseTemplate?: 100 | 101 | 106;
    items: Array<Record<string, any>>;
}

export type SitePagesList = {
    baseTemplate: 119;
    items: Array<Record<string, any>>;
}

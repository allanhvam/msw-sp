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
    created?: string;
    forms?: Array<Form>;
} & (GenericList | SitePagesList);

export enum PageType {
    Invalid = -1,
    DefaultView = 0,
    NormalView = 1,
    DialogView = 2,
    View = 3,
    DisplayForm = 4,
    DisplayFormDialog = 5,
    EditForm = 6,
    EditFormDialog = 7,
    NewForm = 8,
    NewFormDialog = 9,
    SolutionForm = 10,
    PAGE_MAXITEMS = 11
}

export type Form = {
    id?: string,
    formType?: PageType,
    serverRelativeUrl?: string,
    decodedUrl?: string,
}

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

import type { List } from "./List.js";

export type Web = {
    title: string,
    serverRelativeUrl: string;
    lists?: Array<List>;
}
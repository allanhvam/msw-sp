import type { File } from "./File.js";

export type Folder = {
    name?: string;

    files?: Array<File>;
    folders?: Array<Folder>;
    uniqueContentTypeOrder?: Array<{ stringValue: string }>;
}
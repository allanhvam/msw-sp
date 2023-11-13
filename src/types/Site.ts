import type { User } from "./User.js";
import type { Web } from "./Web.js";

export type Site = {
    id?: string;
    isHubSite?: boolean;
    rootWeb: Web;
    users?: Array<User>;
}
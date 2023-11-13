import type { User } from "../types/User.js";
import { UserMock } from "./UserMock.js";

/**
 * @internal
 */
export class UsersMock {

    constructor(private users?: Array<User>) {
    }

    getById = (id: number | string) => {
        const list = this.users?.find(user => user.id.toString() === id.toString());
        return new UserMock(list);
    };

    get = async () => {
        if (!this.users) {
            return new Response(undefined, { status: 404 });
        }

        const mocks = this.users.map(user => new UserMock(user));
        const infos = new Array<any>();
        for (let i = 0; i !== mocks.length; i++) {
            const list = await mocks[i].get();
            infos.push(await list.json());
        }

        return new Response(
            JSON.stringify(infos),
            { status: 200 },
        );
    };
}
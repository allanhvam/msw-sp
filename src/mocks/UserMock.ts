import type { User } from "../types/User.js";

/**
 * @internal
 */
export class UserMock {
    constructor(private user?: User) {
    }

    get = async () => {
        if (!this.user) {
            return new Response(undefined, { status: 404 });
        }

        return new Response(
            JSON.stringify({
                Id: this.user.id,
                Title: this.user.title,
            }),
            { status: 200 },
        );
    };
}
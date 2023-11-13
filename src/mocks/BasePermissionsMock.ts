/**
 * @internal
 */
export class BasePermissionsMock {
    constructor(private parent: any) {
    }


    get = async () => {
        if (!this.parent) {
            return new Response(undefined, { status: 404 });
        }

        return new Response(
            JSON.stringify({
                "High": "2147483647",
                "Low": "4294705151"
            }),
            { status: 200 },
        );
    };
}
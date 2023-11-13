
/**
 * @internal
 */
export class ViewFieldMock {
    constructor(private viewField: string) {
    }

    get = async () => {
        if (!this.viewField) {
            return new Response(undefined, { status: 404 });
        }

        return new Response(
            JSON.stringify(this.viewField),
            { status: 200 },
        );
    };
}
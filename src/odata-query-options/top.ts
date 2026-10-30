export const top = <T>(
    url: string,
    objects: Array<T> | undefined
): Array<T> | undefined | Response => {
    if (!objects) {
        return objects;
    }
    const value = new URL(url).searchParams.get("$top");
    if (value === null) {
        return objects;
    }
    const count = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(count)) {
        return new Response(undefined, { status: 400 });
    }
    return objects.slice(0, count);
};

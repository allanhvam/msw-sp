export const orderBy = <T>(url: string, objects: Array<T> | undefined): Array<T> | undefined => {
    if (!objects) {
        return objects;
    }
    const { search } = new URL(url);
    let uri = decodeURIComponent(search);
    if (uri.indexOf("?") === 0) {
        uri = uri.substring(1);
    }
    // Replace + with space
    uri = uri.replace(/\+/g, " ");
    if (!uri) {
        return objects;
    }

    const searchParams = new URLSearchParams(uri);
    if (searchParams.has("$orderby")) {
        let orderBy = searchParams.get("$orderby") ?? "";
        if (orderBy.includes(",")) {
            console.log("msw-sp: odata $orderby only supported on one property");
            orderBy = orderBy.split(",")[0];
        }
        const [property, order] = orderBy.split(" ");
        objects.sort((a, b) => {
            const aValue = a[property];
            const bValue = b[property];
            if (typeof aValue === "number" && typeof bValue === "number") {
                if (order === "desc") {
                    return bValue - aValue;
                }
                return aValue - bValue;
            }
            const aStr: string = aValue?.toString() ?? "";
            const bStr: string = bValue?.toString() ?? "";

            if (order === "desc") {
                return bStr.localeCompare(aStr);
            }
            return aStr.localeCompare(bStr);
        });
    }

    return objects;
};

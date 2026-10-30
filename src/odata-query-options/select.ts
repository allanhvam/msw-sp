export const select = (url: string, objects: unknown): unknown => {
    const value = new URL(url).searchParams.get("$select");
    if (!value) {
        return objects;
    }
    const fields = value.split(",").map(field => field.trim());
    if (fields.includes("*")) {
        return objects;
    }

    const project = (object: unknown): unknown => {
        if (object === null || typeof object !== "object") {
            return object;
        }
        return Object.fromEntries(
            Object.entries(object).filter(([key]) => fields.includes(key))
        );
    };

    return Array.isArray(objects) ? objects.map(project) : project(objects);
};
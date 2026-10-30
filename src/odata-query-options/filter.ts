import type { Filter, FilterTarget } from "../odata-parser/index.js";
import { parseFilter } from "../odata-parser/index.js";

const filterObjects = <T>(objects: Array<T>, ast: Filter): Array<T> => {
    const getTarget = (target: FilterTarget): ((o: any) => any) => {
        return (o: any) => {
            switch (target.type) {
                case "literal":
                    return target.value;
                case "property":
                    return target.name.split("/").reduce((value, key) => value?.[key], o);
                case "functioncall": {
                    const [first, second] = target.args.map((arg) => getTarget(arg)(o));
                    switch (target.func) {
                        case "startswith":
                            return (
                                typeof first === "string" &&
                                typeof second === "string" &&
                                first.startsWith(second)
                            );
                        case "substringof":
                            return (
                                typeof first === "string" &&
                                typeof second === "string" &&
                                second.includes(first)
                            );
                        case "day":
                        case "month":
                        case "year":
                        case "hour":
                        case "minute":
                        case "second": {
                            if (typeof first !== "string") {
                                return undefined;
                            }
                            const date = new Date(first);
                            switch (target.func) {
                                case "day":
                                    return date.getUTCDate();
                                case "month":
                                    return date.getUTCMonth() + 1;
                                case "year":
                                    return date.getUTCFullYear();
                                case "hour":
                                    return date.getUTCHours();
                                case "minute":
                                    return date.getUTCMinutes();
                                case "second":
                                    return date.getUTCSeconds();
                                default:
                                    return undefined;
                            }
                        }
                        default:
                            throw new Error(
                                `msw-sp: odata function ${target.func} not implemented.`
                            );
                    }
                }
            }
        };
    };

    switch (ast.type) {
        case "functioncall":
            return objects.filter((o) => getTarget(ast)(o));
        case "or": {
            const left = filterObjects(objects, ast.left);
            const right = filterObjects(objects, ast.right);

            return left.concat(right).filter((value, index, array) => {
                return array.indexOf(value) === index;
            });
        }
        case "and": {
            const left = filterObjects(objects, ast.left);
            const right = filterObjects(objects, ast.right);

            return left.filter((l) => right.find((r) => r === l));
        }
        case "lt": {
            const left = getTarget(ast.left);
            const right = getTarget(ast.right);

            return objects.filter((o) => left(o) < right(o));
        }
        case "le": {
            const left = getTarget(ast.left);
            const right = getTarget(ast.right);

            return objects.filter((o) => left(o) <= right(o));
        }
        case "gt": {
            const left = getTarget(ast.left);
            const right = getTarget(ast.right);

            return objects.filter((o) => left(o) > right(o));
        }
        case "ge": {
            const left = getTarget(ast.left);
            const right = getTarget(ast.right);

            return objects.filter((o) => left(o) >= right(o));
        }
        case "eq": {
            const left = getTarget(ast.left);
            const right = getTarget(ast.right);

            return objects.filter((o) => left(o) === right(o));
        }
        case "ne": {
            const left = getTarget(ast.left);
            const right = getTarget(ast.right);

            return objects.filter((o) => left(o) !== right(o));
        }
        default:
            throw new Error("msw-sp: odata filter operator not implemented.");
    }
};

export const filter = <T>(url: string, objects: Array<T> | undefined): Array<T> | undefined => {
    if (!objects) {
        return objects;
    }
    const expression = new URL(url).searchParams.get("$filter");
    if (!expression) {
        return objects;
    }
    return filterObjects(objects, parseFilter(expression));
};

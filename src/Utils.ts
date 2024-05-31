/**
 * @internal
 */
export const Utils = {
    upperCaseKeys: (o: any) => {
        if (!o) {
            return o;
        }
        const f: Record<string, any> = {};
        const keys = Object.keys(o);
        keys.forEach((key) => {
            const newKey = key.charAt(0).toUpperCase() + key.slice(1);
            f[newKey] = o[key];
        });

        return f;
    },
    lowerCaseKeys: (o: any) => {
        if (!o) {
            return o;
        }
        const f: Record<string, any> = {};
        const keys = Object.keys(o);
        keys.forEach((key) => {
            const newKey = key.charAt(0).toLowerCase() + key.slice(1);
            f[newKey] = o[key];
        });

        return f;
    },
    objects: {
        /**
         * Returns object with only simple properties
         */
        getSimple: (o: object): object => {
            const keys = Object.keys(o);

            const simple = {};
            for (const key of keys) {
                const value = o[key];
                switch (typeof value) {
                    case "bigint":
                    case "boolean":
                    case "number":
                    case "string":
                        simple[key] = value;
                }
            }

            return simple;
        }
    },
    strings: {
        getGUID: (): string => {
            let d = Date.now();
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                const r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
            });
        },

        trimStart: (s: string, trim: string) => {
            while (s.indexOf(trim) === 0) {
                s = s.substring(trim.length);
            }
            return s;
        },

        trimEnd: (s: string, trim: string) => {
            while (s.lastIndexOf(trim) === s.length - trim.length) {
                s = s.substring(0, s.length - trim.length);
            }
            return s;
        },

        trim: (s: string, trim: string) => {
            return Utils.strings.trimEnd(Utils.strings.trimStart(s, trim), trim);
        },
    },
    urls: {
        equals: (a: string, b: string) => {
            return Utils.strings.trim(a, "/").toLowerCase() ===
                Utils.strings.trim(b, "/").toLowerCase();
        },

        combine: (a: string, b: string) => {
            return `${Utils.strings.trimEnd(a, "/")}/${Utils.strings.trimStart(b, "/")}`;
        }
    },
};
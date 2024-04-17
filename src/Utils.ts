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
    strings: {
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
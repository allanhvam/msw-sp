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
    urlEquals: (a: string, b: string) => {
        const trimStart = (s: string, trim: string) => {
            while (s.indexOf(trim) === 0) {
                s = s.substring(trim.length);
            }
            return s;
        };

        const trimEnd = (s: string, trim: string) => {
            while (s.lastIndexOf(trim) === s.length - trim.length) {
                s = s.substring(0, s.length - trim.length);
            }
            return s;
        };

        const trim = (s: string, trim: string) => {
            return trimEnd(trimStart(s, trim), trim);
        };

        return trim(a, "/").toLowerCase() === trim(b, "/").toLowerCase();
    },
};
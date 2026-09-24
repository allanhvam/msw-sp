export type LiteralTarget = { type: "literal"; value: string | number | boolean | null };
export type PropertyTarget = { type: "property"; name: string };
export type FunctionCall = { type: "functioncall"; func: string; args: FilterTarget[] };

export type FilterTarget = LiteralTarget | PropertyTarget | FunctionCall;

export type AndFilter = { type: "and"; left: Filter; right: Filter };
export type OrFilter = { type: "or"; left: Filter; right: Filter };
export type CompareFilter = {
    type: "eq" | "ne" | "gt" | "ge" | "lt" | "le";
    left: FilterTarget;
    right: FilterTarget;
};

export type Filter = AndFilter | OrFilter | CompareFilter | FunctionCall;

type Token = { type: "identifier" | "string" | "number" | "punctuation"; value: string };

const tokenize = (input: string): Token[] => {
    const tokens: Token[] = [];
    let position = 0;

    while (position < input.length) {
        const remaining = input.slice(position);
        if (/^\s/.test(remaining)) {
            position++;
            continue;
        }

        const datetime = /^datetime(?=')/i.exec(remaining);
        if (datetime) {
            position += datetime[0].length;
        }
        if (input[position] === "'") {
            position++;
            let value = "";
            let closed = false;
            while (position < input.length) {
                if (input[position] === "'") {
                    position++;
                    if (input[position] !== "'") {
                        closed = true;
                        break;
                    }
                }
                value += input[position++];
            }
            if (!closed) {
                throw new Error("msw-sp: unterminated odata string literal");
            }
            tokens.push({ type: "string", value });
            continue;
        }

        if ("(),".includes(input[position])) {
            tokens.push({ type: "punctuation", value: input[position++] });
            continue;
        }

        const number = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(remaining);
        if (number) {
            tokens.push({ type: "number", value: number[0] });
            position += number[0].length;
            continue;
        }

        const identifier = /^[A-Za-z_][\w]*(?:\/[A-Za-z_][\w]*)*/.exec(remaining);
        if (identifier) {
            tokens.push({ type: "identifier", value: identifier[0] });
            position += identifier[0].length;
            continue;
        }

        throw new Error(`msw-sp: invalid odata filter at position ${position}`);
    }
    return tokens;
};

class FilterParser {
    private position = 0;

    constructor(private readonly tokens: Token[]) {}

    parse(): Filter {
        const filter = this.parseOr();
        if (this.peek()) {
            throw new Error(`msw-sp: unexpected odata token '${this.peek()?.value}'`);
        }
        return filter;
    }

    private peek(): Token | undefined {
        return this.tokens[this.position];
    }

    private take(value: string): boolean {
        const token = this.peek();
        if (
            token?.value.toLowerCase() === value &&
            token.type === ("(),".includes(value) ? "punctuation" : "identifier")
        ) {
            this.position++;
            return true;
        }
        return false;
    }

    private expect(value: string): void {
        if (!this.take(value)) {
            throw new Error(`msw-sp: expected '${value}' in odata filter`);
        }
    }

    private parseOr(): Filter {
        let left = this.parseAnd();
        while (this.take("or")) {
            left = { type: "or", left, right: this.parseAnd() };
        }
        return left;
    }

    private parseAnd(): Filter {
        let left = this.parsePredicate();
        while (this.take("and")) {
            left = { type: "and", left, right: this.parsePredicate() };
        }
        return left;
    }

    private parsePredicate(): Filter {
        if (this.take("(")) {
            const filter = this.parseOr();
            this.expect(")");
            return filter;
        }

        const left = this.parseTarget();
        const operator = this.peek()?.value.toLowerCase();
        switch (operator) {
            case "eq":
            case "ne":
            case "gt":
            case "ge":
            case "lt":
            case "le":
                this.position++;
                return { type: operator, left, right: this.parseTarget() };
            default:
                if (left.type === "functioncall") {
                    return left;
                }
                throw new Error(
                    `msw-sp: expected comparison in odata filter after '${this.tokens[this.position - 1].value}'`
                );
        }
    }

    private parseTarget(): FilterTarget {
        const token = this.tokens[this.position++];
        if (!token) {
            throw new Error("msw-sp: unexpected end of odata filter");
        }
        if (token.type === "string") {
            return { type: "literal", value: token.value };
        }
        if (token.type === "number") {
            return { type: "literal", value: Number(token.value) };
        }
        if (token.type !== "identifier") {
            throw new Error(`msw-sp: unexpected odata token '${token.value}'`);
        }
        const keyword = token.value.toLowerCase();
        if (keyword === "true" || keyword === "false" || keyword === "null") {
            return { type: "literal", value: keyword === "null" ? null : keyword === "true" };
        }
        if (this.take("(")) {
            const args: FilterTarget[] = [];
            if (!this.take(")")) {
                do {
                    args.push(this.parseTarget());
                } while (this.take(","));
                this.expect(")");
            }
            return { type: "functioncall", func: keyword, args };
        }
        return { type: "property", name: token.value };
    }
}

export const parseFilter = (input: string): Filter => new FilterParser(tokenize(input)).parse();

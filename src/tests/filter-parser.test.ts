import * as assert from "node:assert";
import { describe, test } from "node:test";
import { parseFilter } from "../odata-parser/index.js";

void describe("filter parser", async () => {
    await test("and takes precedence over or", () => {
        assert.deepEqual(
            parseFilter("Title eq 'Empty' or Title eq 'Full' and ItemCount gt 0"),
            parseFilter("Title eq 'Empty' or (Title eq 'Full' and ItemCount gt 0)")
        );
    });

    await test("parses escaped quotes and ampersands in literals", () => {
        assert.deepEqual(parseFilter("Title eq 'It''s & More'"), {
            type: "eq",
            left: { type: "property", name: "Title" },
            right: { type: "literal", value: "It's & More" },
        });
    });

    await test("rejects malformed filters", () => {
        assert.throws(() => parseFilter("Title eq 'Unclosed"), /unterminated/);
        assert.throws(() => parseFilter("Title eq 'Filters' xor Hidden eq true"), /unexpected/);
    });

    await test("rejects a bare property name", () => {
        assert.throws(() => parseFilter("filter"), {
            name: "Error",
            message: "msw-sp: expected comparison in odata filter after 'filter'",
        });
    });
});

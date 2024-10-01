# msw-sp

MSW handlers for mocking SharePoint REST api.

## Usage

1. Install `msw` (https://mswjs.io/docs/getting-started)
2. Install `msw-sp`
3. Define your SharePoint model:

```
import { Tenant } from "msw-sp";

const tenant = {
    title: "tenant",
    url: "https://tenant.sharepoint.com",
    sites: {
        "/": {
            rootWeb: {
                title: "Title",
                serverRelativeUrl: "/",
            },
        }
    },
} satisfies Tenant;
```

3. Import `handlers` from `msw-sp`, pass it the tenant model, and give
   the handlers to the specific setup function:

```

// Node.js
import { setupServer } from 'msw/node'
import { handlers } from 'msw-sp';

export const server = setupServer(...handlers({ tenant }));

// Browser
import { setupServer } from 'msw/browser'
import { handlers } from 'msw-sp';

export const worker = setupWorker(...handlers({ tenant }));
```

## Delay

The `handlers` function accepts a `delay` property to simulate real-world client
communication (concept similar to https://mswjs.io/docs/api/delay/). `delay` can be:

-   undefined, nearly instantaneously responses (default behavior)
-   `number`, responses are delayed by specified milliseconds
-   `"real"`, realistic response time
-   `"infinite"`, response is forever pending

Example:

```
...handlers({ tenant, delay: "real" })
```

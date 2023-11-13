# msw-sp

MSW handlers for mocking SharePoint REST api.

## Usage

1. Install MSW (https://mswjs.io/docs/getting-started)
2. Define your SharePoint model:

```
const url = "https://tenant.sharepoint.com;";
const tenant = {
    title: "tenant",
    url,
    sites: {
        "/": {
            rootWeb: {
                title: "Title",
                serverRelativeUrl: "/",
            },
        }
    },
};
```

3. Import `handlers` from `msw-sp`, and pass it the tenant model:

```
import { handlers } from 'msw-sp';

// Node.js
export const server = setupServer(...handlers(tenant));

// Browser
export const worker = setupWorker(...handlers(tenant));
```

---
'@vskstudio/takt-mcp': patch
---

Release the HTTP response body before retrying a transient failure so the connection returns to the pool. Drop the redundant build from the `release` script (`prepublishOnly` already builds).

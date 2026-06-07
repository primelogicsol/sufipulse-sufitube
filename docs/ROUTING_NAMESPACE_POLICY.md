# ROUTING NAMESPACE POLICY

## Institutional Collision Protection

The SufiPulse Next.js application already hosts a mature ecosystem of public routes related to the institution's creative and operational output.

To prevent destructive collisions with existing pages, the Sufi Knowledge Authority Database **must be strictly quarantined** into a dedicated namespace.

### Existing Protected Routes (DO NOT OVERWRITE)
* **Creative Contributors:** `/writers`, `/vocalists`, `/producers`, `/literary-contributors`
* **Production Infrastructure:** `/studio`, `/studio-engineers`, `/literary-journal`, `/releases`
* **Institutional Identity:** `/about/what-is-sufipulse`, `/about/founder`, `/about/our-network`, `/about/institutional-partners`
* **Institutional Engagement:** `/official-channels`, `/collaboration`, `/product-infrastructure`, `/governance`

### New Intelligence Namespace (REQUIRED)
All new knowledge pages generated from the graph must be nested under the `/knowledge` prefix. This enforces a clear distinction between SufiPulse's institutional operations and its role as an academic database.

* **Songs:** `/knowledge/songs/[slug]`
* **Writers:** `/knowledge/writers/[slug]`
* **Singers:** `/knowledge/singers/[slug]`
* **Concepts:** `/knowledge/concepts/[slug]`
* **Questions:** `/knowledge/questions/[slug]`

### Internal Prototypes
Before public launch, the pages will be developed and reviewed under an internal or preview lab namespace:
* `/lab/knowledge/...`
* `/admin/intelligence-preview/...`

**Routing Mandate:** Never map intelligence nodes to the root domain or top-level reserved keywords.

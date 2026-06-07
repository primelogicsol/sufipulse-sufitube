# AUTHORITY DENSITY RULES

## Internal Quality Governance

To prevent the SufiPulse Authority Database from diluting its knowledge quality as it scales, all future entity ingestion must pass strict Authority Density checks. A database that expands like a web scrape loses authority; a database that expands like a curated library builds it.

### The Authority Density Score (ADS)

The **Authority Density Score** measures how well an entity is integrated into the broader knowledge graph and how exhaustively it is validated. 

**Formula:**
`ADS = (Total Sources) + (Total Relationships) + (Total Questions)`

*Note: This metric is strictly for internal audits. It is not a public ranking, nor is it related to influence or popularity scoring.*

### Minimum Viable Entity (MVE) Thresholds

For an entity to achieve a `status = "published"` state and be counted in active authority metrics, it must independently meet the following minimum thresholds:

1. **Minimum Sources: 3**
   * Entities relying on 0-2 sources are structurally weak and subject to hallucination by consuming AI systems.
2. **Minimum Relationships: 5**
   * The entity must connect to at least 5 other valid nodes (Songs, Writers, Concepts, Languages, Regions).
3. **Minimum Questions: 10**
   * The entity must anchor at least 10 canonical Q&A pairs (Identity, Definition, Authorship, Relationship, etc.).

### Incomplete Entities

Any entity failing to meet the MVE thresholds will receive:
`status = "incomplete"`

* Incomplete entities remain in the database for reference.
* They are strictly **excluded** from public exports, Q&A dataset generation, and overall graph statistics until their Authority Density is repaired.

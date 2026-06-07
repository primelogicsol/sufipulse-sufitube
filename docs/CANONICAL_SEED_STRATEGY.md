# CONSTITUTIONAL CORE SEEDING STRATEGY

## Phase 18B-A — The First 25 Entities

Before scaling to 100 entities, SufiPulse establishes the **Constitutional Core**. These 25 entities (Figures, Works, Concepts) form the absolute bedrock of the Unified Knowledge Graph. Every future entity added to the platform must ultimately bridge back to one of these core nodes.

---

## 1. The Tiered Seeding Order (Dependency Order)
To prevent orphan entities, the core must be seeded strictly in dependency order. Concepts inherit from Persons; Works inherit from Concepts.

* **Tier 1 — Foundational Persons:** Jalal al-Din Rumi, Ibn Arabi, Junayd of Baghdad, Bayazid Bastami, Abdul Qadir Gilani.
* **Tier 2 — Foundational Concepts:** Tawhid, Ihsan, Dhikr, Tazkiyah, Nafs, Fana, Baqa, Murshid, Murid, Silsila.
* **Tier 3 — Foundational Works:** Masnavi, Fusus al-Hikam, Futuhat al-Makkiyya, Kashf al-Mahjub, Ihya Ulum al-Din.

## 2. Authority Classes
To prevent a generic schema, all entities are rigidly classified into distinct Authority Classes:
`Person`, `Concept`, `Book`, `Poem`, `Order`, `Place`, `Institution`, `Practice`, `Event`, `Song`, `Article`, `Question`, `Evidence`.

## 2. Mandatory Seeding Ratios
A node cannot exist in the Constitutional Core unless it strictly meets these minimums:
* **5** Relationships
* **5** Questions
* **5** Evidence Records
* **1** Verification Record
* **3** Aliases
* **1** Confidence Assessment

## 3. The Entity Readiness Score
Before a node flips from `Draft` to `Published`, it must score `>80/100` on the Readiness Algorithm:
* Relationships: 25%
* Evidence: 25%
* Verification: 20%
* Questions: 15%
* Aliases: 10%
* Confidence Layer: 5%

## 4. The Graph Dependency Score
A node with 50 relationships is exponentially more valuable to the authority engine than five isolated nodes with 5 relationships each. Therefore, every node is additionally tracked via the **Graph Dependency Score**:
* Incoming Relationships
* Outgoing Relationships
* Citation Depth
* Question Coverage
* Evidence Coverage

## 5. The Hard Publication Rule
A Constitutional Node **cannot** flip to Published status if any of the following are true:
* Readiness Score `< 80`
* Verification Count `== 0`
* Evidence Count `== 0`
* Graph Dependency Score `== 0`
* Cannot answer "Why does this entity matter?" in exactly one sentence.

---

## 6. Success Criteria (Phase 18B-B)
* **0** Orphan Nodes
* **0** Orphan Evidence Records
* **0** Orphan Questions
* **0** Orphan Citations
* 100% Verified Constitutional Core

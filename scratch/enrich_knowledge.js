const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '../.data/knowledge-registry.json');
const relsPath = path.join(__dirname, '../.data/atlas_relationships.json');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const rels = JSON.parse(fs.readFileSync(relsPath, 'utf8'));

const newPersons = [
  {
    "id": "person_ibn_arabi",
    "type": "saint",
    "slug": "ibn-arabi",
    "name": "Ibn Arabi",
    "alternateNames": ["Muhyiddin", "Shaykh al-Akbar", "Ibn al-'Arabi"],
    "shortDescription": "One of the most prolific and influential Sufi masters and philosophers, known as the 'Greatest Master' (Shaykh al-Akbar), who formalized the concept of Wahdat al-Wujud (Unity of Being).",
    "longDescription": "Muhyiddin Ibn Arabi (1165–1240) was an Andalusian Muslim scholar, mystic, poet, and philosopher. Born in Murcia, Al-Andalus, his works have had a monumental impact on the Islamic philosophical and mystical traditions. Over his lifetime, he wrote hundreds of works, the most famous being 'Fusus al-Hikam' (The Bezels of Wisdom) and 'Al-Futuhat al-Makkiyya' (The Meccan Revelations). He formalized the esoteric doctrine that would later be termed Wahdat al-Wujud (the Unity of Being), which asserts that there is only one true Existence—God—and that all created things are merely reflections or manifestations of His Divine Names and Attributes. His profound, dense, and often paradoxical writings mapped the cosmology of Sufism for centuries, deeply influencing later Persian, Turkish, and South Asian mystic traditions.",
    "theologicalNotes": "The core of Ibn Arabi's theology revolves around Wahdat al-Wujud. He argued that the cosmos is a theater in which God's names are manifested, and that the Perfect Man (Al-Insan al-Kamil) acts as the bridge and ultimate mirror between the Creator and the created.",
    "regionLinks": ["es", "ma", "eg", "sy", "tr"],
    "languageLinks": ["ar"],
    "relatedConcepts": ["wahdat_al_wujud", "fana", "baqa"],
    "relatedReleases": [],
    "relatedArticles": [],
    "relatedPlaylists": [],
    "sameAs": ["https://en.wikipedia.org/wiki/Ibn_Arabi"],
    "wikidataId": "Q146114",
    "isActive": true,
    "isPublic": true,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString(),
    "knowledgeDensityScore": 95
  },
  {
    "id": "person_bayazid",
    "type": "saint",
    "slug": "bayazid-bastami",
    "name": "Bayazid Bastami",
    "alternateNames": ["Abu Yazid al-Bistami", "Tayfur Abu Yazid al-Bustami"],
    "shortDescription": "A 9th-century Persian Sufi renowned for his intense 'drunken' (intoxicated) expressions of divine love and his pioneering concept of fana (annihilation of the ego).",
    "longDescription": "Bayazid Bastami (d. 874 CE) is considered one of the 'Golden Chain' masters in the Naqshbandi tariqa and one of the pivotal figures in early Islamic mysticism. Operating out of Bastam, Persia, he represented the 'intoxicated' (sukr) school of Sufism, distinct from the 'sober' (sahw) school of Junayd of Baghdad. Bayazid is most famous for his 'shathiyat' (ecstatic utterances), such as 'Glory be to Me! How great is My majesty!', spoken when his ego was completely annihilated (fana) and he was entirely submerged in the Divine Presence. His radical emphasis on the utter erasure of the self before God set the precedent for later ecstatic mystic poets, including Rumi and Attar.",
    "theologicalNotes": "Bayazid formulated the experiential state of 'Fana' (annihilation of the self in God) and 'Baqa' (subsistence in God). He believed that the seeker must completely empty the vessel of the 'I' so that only 'He' remains.",
    "regionLinks": ["ir"],
    "languageLinks": ["ar", "fa"],
    "relatedConcepts": ["fana", "baqa"],
    "relatedReleases": [],
    "relatedArticles": [],
    "relatedPlaylists": [],
    "sameAs": ["https://en.wikipedia.org/wiki/Bayazid_Bastami"],
    "wikidataId": "Q466986",
    "isActive": true,
    "isPublic": true,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString(),
    "knowledgeDensityScore": 90
  },
  {
    "id": "person_junayd",
    "type": "saint",
    "slug": "junayd-of-baghdad",
    "name": "Junayd of Baghdad",
    "alternateNames": ["Abu'l-Qasim al-Junayd al-Baghdadi", "Sayyid al-Ta'ifa"],
    "shortDescription": "The undisputed master of the 'sober' school of early Sufism, who structured mystical experience within the strict bounds of Islamic jurisprudence (Sharia).",
    "longDescription": "Junayd of Baghdad (830–910 CE) is a central figure in the spiritual lineage of many major Sufi orders. Known as 'Sayyid al-Ta'ifa' (The Master of the Group), he established the 'sober' (sahw) school of Sufism, which argued that the highest state of mysticism is not ecstatic annihilation (fana) but rather a return to the world in a state of subsistence (baqa) while strictly adhering to Sharia. He safely navigated the volatile political and theological climate of 9th-century Baghdad by insisting that all esoteric knowledge must be anchored in the Quran and Sunnah. Junayd provided the critical theological framework that prevented early Sufism from being marginalized, integrating it firmly into orthodox Islamic scholarship.",
    "theologicalNotes": "Junayd developed the doctrine of 'Sahu' (sobriety) following 'Sukr' (intoxication). He taught that after the seeker experiences the destruction of the ego (Fana), they must return to a state of Baqa, acting perfectly in the world as a servant of God.",
    "regionLinks": ["iq"],
    "languageLinks": ["ar"],
    "relatedConcepts": ["fana", "baqa", "sharia"],
    "relatedReleases": [],
    "relatedArticles": [],
    "relatedPlaylists": [],
    "sameAs": ["https://en.wikipedia.org/wiki/Junayd_of_Baghdad"],
    "wikidataId": "Q368735",
    "isActive": true,
    "isPublic": true,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString(),
    "knowledgeDensityScore": 92
  },
  {
    "id": "person_abdul_qadir",
    "type": "saint",
    "slug": "abdul-qadir-gilani",
    "name": "Abdul Qadir Gilani",
    "alternateNames": ["Ghaus-e-Azam", "Muhiyuddin", "Shaikh Abdul Qadir Jilani"],
    "shortDescription": "The eponymous founder of the Qadiriyya order, one of the oldest and most widespread Sufi tariqas in the world.",
    "longDescription": "Abdul Qadir Gilani (1077–1166 CE) was a Hanbali scholar, preacher, and mystic based in Baghdad. Known universally among his followers as 'Ghaus-e-Azam' (The Great Helper), he is perhaps the most universally revered saint in the Islamic world. His sermons, collected in texts like 'Futuh al-Ghaib' (Revelations of the Unseen), emphasize spiritual sincerity, reliance on God (Tawakkul), and rigorous moral purification. The Qadiriyya tariqa, which traces its lineage to him, spread rapidly from Iraq across North Africa, the Middle East, and South Asia, laying the groundwork for mass institutional Sufism.",
    "theologicalNotes": "His teachings masterfully synthesized outward religious law (Sharia) with inward spiritual truth (Tariqa). He fiercely advocated for 'Tawakkul' (absolute reliance on God) and the purging of the heart from attachments to anything other than the Creator.",
    "regionLinks": ["ir", "iq", "pk", "in"],
    "languageLinks": ["ar", "fa"],
    "relatedConcepts": ["tawakkul", "tariqa", "sharia"],
    "relatedReleases": [],
    "relatedArticles": [],
    "relatedPlaylists": [],
    "sameAs": ["https://en.wikipedia.org/wiki/Abdul_Qadir_Gilani"],
    "wikidataId": "Q312456",
    "isActive": true,
    "isPublic": true,
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString(),
    "knowledgeDensityScore": 94
  }
];

const newRelationships = [
  {
    "id": "rel_junayd_bayazid",
    "type": "theological_contrast",
    "source": "person_junayd",
    "target": "person_bayazid",
    "properties": {
      "context": "Junayd represented the sober (sahw) school, contrasting with Bayazid's intoxicated (sukr) school.",
      "strength": 90,
      "verified": true
    }
  },
  {
    "id": "rel_rumi_ibnarabi",
    "type": "theological_synthesis",
    "source": "poet_rumi",
    "target": "person_ibn_arabi",
    "properties": {
      "context": "Both operated in the 13th century; Rumi poeticized the divine love that Ibn Arabi philosophized as Unity of Being.",
      "strength": 85,
      "verified": true
    }
  },
  {
    "id": "rel_gilani_junayd",
    "type": "spiritual_lineage",
    "source": "person_abdul_qadir",
    "target": "person_junayd",
    "properties": {
      "context": "Gilani's spiritual chain (silsila) traces back through Junayd of Baghdad.",
      "strength": 100,
      "verified": true
    }
  }
];

// Add to registry avoiding duplicates
newPersons.forEach(p => {
  if (!registry.find(r => r.slug === p.slug || r.id === p.id)) {
    registry.push(p);
  }
});

// Add to rels
newRelationships.forEach(r => {
  if (!rels.find(rel => rel.id === r.id)) {
    rels.push(r);
  }
});

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
fs.writeFileSync(relsPath, JSON.stringify(rels, null, 2));

console.log('Enriched registry with 4 saints and 3 relationships.');

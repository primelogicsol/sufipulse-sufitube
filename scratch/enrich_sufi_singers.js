const fs = require('fs');
const path = require('path');

const corePath = path.join(__dirname, '../.data/constitutional_core.json');
const registryPath = path.join(__dirname, '../.data/knowledge-registry.json');
const relsPath = path.join(__dirname, '../.data/atlas_relationships.json');

const core = JSON.parse(fs.readFileSync(corePath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const rels = JSON.parse(fs.readFileSync(relsPath, 'utf8'));

const newSingers = [
  {
    "id": "singer_nfak",
    "type": "singer",
    "slug": "nusrat-fateh-ali-khan",
    "name": "Nusrat Fateh Ali Khan",
    "alternateNames": ["NFAK", "Shahenshah-e-Qawwali"],
    "shortDescription": "The undisputed king of Qawwali who single-handedly brought Sufi devotional music to the global stage.",
    "longDescription": "Nusrat Fateh Ali Khan (1948–1997) was a Pakistani vocalist, musician, and songwriter, primarily a singer of Qawwali, the devotional music of the Sufis. Widely considered the greatest Qawwali singer of all time, he possessed a vocal range spanning over four octaves and an extraordinary ability to improvise. Born in Faisalabad into a family of Qawwals tracing their lineage back 600 years, he inherited the art from his father, Ustad Fateh Ali Khan. He brought Qawwali from the shrines of Pakistan to concert halls worldwide, collaborating with Peter Gabriel's Real World Records, Eddie Vedder, and composing Bollywood soundtracks. His recordings number over 125 albums. He was awarded the UNESCO Music Prize and Pakistan's highest civilian honor, the Pride of Performance.",
    "theologicalNotes": "His renditions of classical Sufi poetry by Amir Khusrau, Bulleh Shah, and Sultan Bahoo transformed esoteric mystical verses into universally accessible emotional experiences, making him the most powerful ambassador of Sufism in the modern era.",
    "regionLinks": ["pk", "global"],
    "languageLinks": ["ur", "pa", "fa"],
    "relatedConcepts": ["qawwali", "sama"],
    "sameAs": ["https://en.wikipedia.org/wiki/Nusrat_Fateh_Ali_Khan"],
    "wikidataId": "Q192540",
    "knowledgeDensityScore": 99,
    "evidenceRecords": 3
  },
  {
    "id": "singer_abida_parveen",
    "type": "singer",
    "slug": "abida-parveen",
    "name": "Abida Parveen",
    "alternateNames": ["Queen of Sufi Music"],
    "shortDescription": "Pakistan's most revered female Sufi vocalist, celebrated for her transcendent performances of kafis and ghazals.",
    "longDescription": "Abida Parveen (born 1954) is a Pakistani Sufi singer, composer, and musician. She is one of the foremost exponents of Sindhi and Punjabi Sufi music, and is widely regarded as one of the greatest mystic singers in the world. Born in Larkana, Sindh, she was trained by her father, Ustad Ghulam Haider, a traditional Sufi singer. She sings predominantly in Sindhi, Urdu, Punjabi, and Saraiki, performing kafis of Shah Abdul Latif Bhittai, Bulleh Shah, and Sachal Sarmast. Her performances are known for inducing states of spiritual ecstasy in audiences. She has performed globally at venues from the Royal Albert Hall to the United Nations. She was listed in the BBC's 100 Greatest Singers of all time.",
    "theologicalNotes": "Her interpretive genius lies in channeling the raw, unfiltered divine longing (Ishq-e-Haqiqi) of the Sindhi and Punjabi Sufi poets, creating an almost trance-like atmosphere that mirrors the Sufi practice of Sama.",
    "regionLinks": ["pk"],
    "languageLinks": ["sd", "ur", "pa"],
    "relatedConcepts": ["kafi", "sama", "ishq"],
    "sameAs": ["https://en.wikipedia.org/wiki/Abida_Parveen"],
    "wikidataId": "Q260822",
    "knowledgeDensityScore": 98,
    "evidenceRecords": 3
  },
  {
    "id": "singer_rahat_fateh_ali_khan",
    "type": "singer",
    "slug": "rahat-fateh-ali-khan",
    "name": "Rahat Fateh Ali Khan",
    "alternateNames": ["Rahat"],
    "shortDescription": "Nephew and protégé of Nusrat Fateh Ali Khan, carrying the Qawwali legacy into the 21st century.",
    "longDescription": "Rahat Fateh Ali Khan (born 1974) is a Pakistani singer, primarily of Qawwali, Sufi music, and Bollywood film soundtracks. He is the nephew of legendary Nusrat Fateh Ali Khan and the son of Ustad Farrukh Fateh Ali Khan. Trained directly by his uncle from the age of seven, Rahat began performing publicly at age nine. He has successfully bridged the classical Qawwali tradition with contemporary pop and Bollywood, recording numerous chart-topping songs and film soundtracks. He received Pakistan's highest civilian award, the Hilal-e-Imtiaz, and the Indian Filmfare Award for Best Playback Singer.",
    "theologicalNotes": "He represents the living continuation of the 600-year Qawwali gharana tradition, adapting the spiritual core of devotional singing to contemporary audiences while maintaining its mystical essence.",
    "regionLinks": ["pk", "in"],
    "languageLinks": ["ur", "pa", "hi"],
    "relatedConcepts": ["qawwali", "gharana"],
    "sameAs": ["https://en.wikipedia.org/wiki/Rahat_Fateh_Ali_Khan"],
    "wikidataId": "Q711498",
    "knowledgeDensityScore": 96,
    "evidenceRecords": 2
  },
  {
    "id": "singer_sami_yusuf",
    "type": "singer",
    "slug": "sami-yusuf",
    "name": "Sami Yusuf",
    "alternateNames": ["Islam's Biggest Rock Star"],
    "shortDescription": "British-Azerbaijani singer-songwriter who pioneered contemporary Islamic and Sufi-inspired music globally.",
    "longDescription": "Sami Yusuf (born 1980) is a British-Azerbaijani singer-songwriter, composer, and multi-instrumentalist. Often referred to as 'Islam's biggest rock star' by Time magazine, he has sold over 34 million records worldwide. Born in Tehran to an Azerbaijani family and raised in London, he studied at the Royal Academy of Music. His music blends Western pop and classical traditions with Islamic nasheeds, Sufi poetry, and musical traditions from the Muslim world. His albums 'Al-Mu'allim' and 'My Ummah' became massive global hits. He is a UN Global Ambassador and uses his platform to promote interfaith harmony and spiritual consciousness.",
    "theologicalNotes": "His work represents the modern globalization of Sufi-inflected devotional music, making Islamic spiritual themes accessible to young, digitally-connected audiences worldwide.",
    "regionLinks": ["gb", "az", "global"],
    "languageLinks": ["en", "ar", "tr", "fa"],
    "relatedConcepts": ["nasheed", "contemporary_sufi"],
    "sameAs": ["https://en.wikipedia.org/wiki/Sami_Yusuf"],
    "wikidataId": "Q312619",
    "knowledgeDensityScore": 93,
    "evidenceRecords": 2
  },
  {
    "id": "singer_sabri_brothers",
    "type": "singer",
    "slug": "sabri-brothers",
    "name": "Sabri Brothers",
    "alternateNames": ["Haji Ghulam Farid Sabri", "Maqbool Ahmed Sabri"],
    "shortDescription": "Legendary Pakistani Qawwali duo who pioneered the recording and global dissemination of Qawwali music.",
    "longDescription": "The Sabri Brothers, primarily Haji Ghulam Farid Sabri (1930–1994) and Maqbool Ahmed Sabri (1945–2011), were a Pakistani Qawwali group from Karachi. They are credited with being the first Qawwali performers to achieve widespread commercial success through studio recordings, beginning in the 1950s. Their iconic rendition of 'Tajdar-e-Haram' remains one of the most recognized Qawwali compositions in history. They performed at international venues across Europe, Asia, and the Americas, paving the way for future generations of Qawwals including Nusrat Fateh Ali Khan. They were awarded Pakistan's Pride of Performance.",
    "theologicalNotes": "They canonized several Sufi devotional compositions in the popular imagination, making shrine poetry accessible to the masses through the medium of commercial recording.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "pa", "fa"],
    "relatedConcepts": ["qawwali", "hamd", "naat"],
    "sameAs": ["https://en.wikipedia.org/wiki/Sabri_Brothers"],
    "wikidataId": "Q7396147",
    "knowledgeDensityScore": 95,
    "evidenceRecords": 2
  },
  {
    "id": "singer_aziz_mian",
    "type": "singer",
    "slug": "aziz-mian",
    "name": "Aziz Mian",
    "alternateNames": ["Aziz Mian Qawwal"],
    "shortDescription": "Rebellious and ecstatic Qawwali master known for marathon performances and improvisational genius.",
    "longDescription": "Aziz Mian Qawwal (1942–2000) was a Pakistani Qawwali singer and poet known for his highly unconventional, intensely emotional, and often controversial style. Unlike the classical restraint of other Qawwals, Aziz Mian was famous for his raw, unscripted, and marathon-length performances that could last for hours, driven by ecstatic improvisation. His most famous work, 'Hashr Ke Roz Yeh Poochhunga', is considered a masterpiece of Sufi defiance and divine love. He composed most of his own poetry, which was deeply philosophical and often challenged orthodox religious interpretations. He was a deeply polarizing figure — revered by devotees and criticized by purists.",
    "theologicalNotes": "His performance style embodied the concept of Hal (mystical state) — a raw, uncontrollable spiritual ecstasy where the performer becomes a vessel for divine expression, transcending formal structure.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "pa"],
    "relatedConcepts": ["qawwali", "hal", "wajd"],
    "sameAs": ["https://en.wikipedia.org/wiki/Aziz_Mian"],
    "wikidataId": "Q797064",
    "knowledgeDensityScore": 94,
    "evidenceRecords": 2
  },
  {
    "id": "singer_kailash_kher",
    "type": "singer",
    "slug": "kailash-kher",
    "name": "Kailash Kher",
    "alternateNames": ["Kailash Kher & Kailasa"],
    "shortDescription": "Indian Sufi-rock vocalist who fused Sufi devotional energy with contemporary rock and folk.",
    "longDescription": "Kailash Kher (born 1973) is an Indian singer, songwriter, and composer known for his distinctive, powerful voice and his fusion of Sufi, folk, and rock music. Born in Meerut, Uttar Pradesh, he moved to Mumbai and rose to fame with the hit 'Allah Ke Bande' (2003), which became an anthem of resilience and faith. With his band Kailasa, he has produced numerous albums blending Sufi mystical themes with contemporary instrumentation. His music draws heavily from the devotional traditions of Rajasthan, Punjab, and the Chishti shrines. He has received the Padma Shri from the Government of India.",
    "theologicalNotes": "He represents the Sufi-rock fusion movement in India, translating the raw energy and universal appeal of Sufi shrine music into a modern idiom accessible to younger generations.",
    "regionLinks": ["in"],
    "languageLinks": ["hi", "pa"],
    "relatedConcepts": ["sufi_rock", "qawwali"],
    "sameAs": ["https://en.wikipedia.org/wiki/Kailash_Kher"],
    "wikidataId": "Q2413627",
    "knowledgeDensityScore": 90,
    "evidenceRecords": 1
  },
  {
    "id": "singer_wadali_brothers",
    "type": "singer",
    "slug": "wadali-brothers",
    "name": "Wadali Brothers",
    "alternateNames": ["Puranchand Wadali", "Pyarelal Wadali"],
    "shortDescription": "Iconic Punjabi Sufi duo from Guru Ki Wadali whose soulful voices defined Punjabi devotional music.",
    "longDescription": "The Wadali Brothers — Ustad Puranchand Wadali (1937–2022) and Pyarelal Wadali (born 1946) — were legendary Indian Sufi singers from the village of Guru Ki Wadali in Amritsar, Punjab. They descended from a five-generation lineage of traditional musicians. Their music is rooted in the Punjabi Sufi tradition, singing kafis and dohas of Bulleh Shah, Sultan Bahoo, and Shah Hussain. Their breakthrough came with the Bollywood film 'Pinjar' and the iconic track 'Tu Mane Ya Na Mane Dildara'. They received the Padma Shri and the Sangeet Natak Akademi Award. Puranchand Wadali passed away in 2022.",
    "theologicalNotes": "Their five-generation lineage represents one of the purest unbroken chains of Punjabi Sufi musical transmission, keeping alive the oral tradition of kafis as they were originally sung at Sufi shrines.",
    "regionLinks": ["in"],
    "languageLinks": ["pa"],
    "relatedConcepts": ["kafi", "doha", "punjabi_sufism"],
    "sameAs": ["https://en.wikipedia.org/wiki/Wadali_Brothers"],
    "wikidataId": "Q7957571",
    "knowledgeDensityScore": 93,
    "evidenceRecords": 1
  },
  {
    "id": "singer_hans_raj_hans",
    "type": "singer",
    "slug": "hans-raj-hans",
    "name": "Hans Raj Hans",
    "alternateNames": [],
    "shortDescription": "Celebrated Indian Sufi and Punjabi devotional singer, disciple of Nusrat Fateh Ali Khan.",
    "longDescription": "Hans Raj Hans (born 1964) is an Indian Sufi and Punjabi singer, and a former Member of Parliament. Born in Jalandhar, Punjab, into a Dalit family, he rose to prominence through his extraordinary vocal talent and devotion to Sufi music. He was a direct disciple of Nusrat Fateh Ali Khan, who mentored him and deeply influenced his musical style. He is renowned for his renditions of kafis by Bulleh Shah, Baba Farid, and Shah Hussain, as well as Punjabi folk songs. He has received the Padma Shri and numerous other accolades. His journey from poverty to national acclaim mirrors the Sufi ideal of transcending worldly barriers through spiritual devotion.",
    "theologicalNotes": "His discipleship under NFAK represents a rare cross-border Sufi musical transmission, bridging the India-Pakistan divide through the universal language of devotional singing.",
    "regionLinks": ["in"],
    "languageLinks": ["pa", "hi"],
    "relatedConcepts": ["kafi", "punjabi_sufism"],
    "sameAs": ["https://en.wikipedia.org/wiki/Hans_Raj_Hans"],
    "wikidataId": "Q5649183",
    "knowledgeDensityScore": 90,
    "evidenceRecords": 1
  },
  {
    "id": "singer_sanam_marvi",
    "type": "singer",
    "slug": "sanam-marvi",
    "name": "Sanam Marvi",
    "alternateNames": [],
    "shortDescription": "Rising Sindhi Sufi singer celebrated for her powerful renditions of Shah Abdul Latif Bhittai's poetry.",
    "longDescription": "Sanam Marvi (born 1986) is a Pakistani Sufi singer from Hyderabad, Sindh. She rose to national fame through the Coke Studio Pakistan television series, where her electrifying performances of Sindhi Sufi poetry captivated millions. She specializes in singing the verses of Shah Abdul Latif Bhittai, Sachal Sarmast, and other Sindhi Sufi poets. Her voice is often compared to that of Abida Parveen for its raw emotional power and spiritual intensity. She represents the new generation of Pakistani Sufi vocalists keeping the Sindhi mystical tradition alive.",
    "theologicalNotes": "She carries forward the living tradition of Sindhi Sufi shrines where the poetry of Shah Abdul Latif Bhittai is recited as a form of active worship and spiritual healing.",
    "regionLinks": ["pk"],
    "languageLinks": ["sd", "ur"],
    "relatedConcepts": ["shah_jo_risalo", "sindhi_sufism"],
    "sameAs": ["https://en.wikipedia.org/wiki/Sanam_Marvi"],
    "wikidataId": "Q7409289",
    "knowledgeDensityScore": 88,
    "evidenceRecords": 1
  },
  {
    "id": "singer_faiz_ali_faiz",
    "type": "singer",
    "slug": "faiz-ali-faiz",
    "name": "Faiz Ali Faiz",
    "alternateNames": [],
    "shortDescription": "Acclaimed Pakistani Qawwal carrying the classical Qawwali tradition at major shrines and global festivals.",
    "longDescription": "Faiz Ali Faiz (born 1962) is a Pakistani Qawwali singer from Hyderabad, Sindh. He comes from a multi-generational family of Qawwals and has been performing since childhood at the shrines of Sindh and Punjab. He gained international recognition through tours organized by European world music festivals and has performed extensively across Europe, the Middle East, and North America. His style is deeply classical and rooted in the traditional shrine Qawwali format, maintaining the meditative, repetitive structures that induce spiritual ecstasy. He is considered one of the most authentic living practitioners of traditional Qawwali.",
    "theologicalNotes": "He preserves the original shrine-based format of Qawwali — unhurried, deeply meditative, and structured around gradual escalation into communal spiritual ecstasy.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "sd", "pa", "fa"],
    "relatedConcepts": ["qawwali", "urs"],
    "sameAs": ["https://en.wikipedia.org/wiki/Faiz_Ali_Faiz"],
    "wikidataId": "Q3064104",
    "knowledgeDensityScore": 90,
    "evidenceRecords": 1
  },
  {
    "id": "singer_atif_aslam",
    "type": "singer",
    "slug": "atif-aslam",
    "name": "Atif Aslam",
    "alternateNames": [],
    "shortDescription": "Pakistani pop sensation who has brought Sufi devotional recitations to massive mainstream audiences.",
    "longDescription": "Atif Aslam (born 1983) is a Pakistani singer, songwriter, and actor. He is one of the most commercially successful Pakistani musicians of all time, with a massive following across South Asia and the diaspora. While primarily a pop and playback singer, he has gained enormous recognition for his deeply moving renditions of Sufi devotional poetry, naats, and hamd. His recitations during Ramadan specials and at live events regularly go viral, reaching tens of millions. His rendition of 'Tajdar-e-Haram' (originally by the Sabri Brothers) became one of the most-viewed Coke Studio performances. He represents the mainstream bridge to Sufi devotional music for younger audiences.",
    "theologicalNotes": "His massive platform has introduced Sufi devotional content — naats, hamds, and classical Qawwali compositions — to an audience of hundreds of millions who might never enter a Sufi shrine.",
    "regionLinks": ["pk", "in", "global"],
    "languageLinks": ["ur", "hi"],
    "relatedConcepts": ["naat", "hamd", "coke_studio"],
    "sameAs": ["https://en.wikipedia.org/wiki/Atif_Aslam"],
    "wikidataId": "Q487497",
    "knowledgeDensityScore": 91,
    "evidenceRecords": 2
  },
  {
    "id": "singer_ali_zafar",
    "type": "singer",
    "slug": "ali-zafar",
    "name": "Ali Zafar",
    "alternateNames": [],
    "shortDescription": "Pakistani singer-actor who has performed notable Sufi-inspired compositions and devotional music.",
    "longDescription": "Ali Zafar (born 1980) is a Pakistani singer, songwriter, model, actor, and painter. While primarily a pop artist and Bollywood playback singer, he has produced several critically acclaimed Sufi-inflected tracks, most notably his powerful renditions on Coke Studio Pakistan. His versatility allows him to move between mainstream pop and deeply spiritual devotional music. He has performed traditional Sufi poetry alongside contemporary arrangements, introducing classical Sufi texts to a generation of young listeners. He has received the Tamgha-e-Imtiaz from the Government of Pakistan.",
    "theologicalNotes": "He represents the contemporary artist who bridges entertainment and devotion, demonstrating that Sufi themes retain their emotional power even when delivered through modern pop production.",
    "regionLinks": ["pk", "in"],
    "languageLinks": ["ur", "hi", "pa"],
    "relatedConcepts": ["contemporary_sufi"],
    "sameAs": ["https://en.wikipedia.org/wiki/Ali_Zafar"],
    "wikidataId": "Q487497",
    "knowledgeDensityScore": 85,
    "evidenceRecords": 1
  },
  {
    "id": "singer_pathanay_khan",
    "type": "singer",
    "slug": "pathanay-khan",
    "name": "Pathanay Khan",
    "alternateNames": ["Pathan Khan"],
    "shortDescription": "Legendary Saraiki folk and Sufi singer whose voice defined the mystical music of southern Punjab.",
    "longDescription": "Pathanay Khan (1942–2000) was a legendary Pakistani folk and Sufi singer from Dera Ghazi Khan, Punjab. He is widely regarded as one of the greatest voices in the Saraiki and Punjabi folk music tradition. His renditions of the poetry of Khwaja Ghulam Farid, the revered Saraiki Sufi poet, are considered definitive and unsurpassable. His powerful, earthy voice and deeply emotional delivery captured the essence of the desert spirituality of southern Punjab. He performed at shrines, festivals, and cultural events throughout his career but never achieved the commercial mainstream fame that his extraordinary talent deserved.",
    "theologicalNotes": "He was the supreme interpreter of Khwaja Ghulam Farid's poetry, giving voice to the deep mystical longing and desert spirituality unique to the Saraiki Sufi tradition.",
    "regionLinks": ["pk"],
    "languageLinks": ["skr", "pa"],
    "relatedConcepts": ["kafi", "saraiki_sufism"],
    "sameAs": ["https://en.wikipedia.org/wiki/Pathanay_Khan"],
    "wikidataId": "Q7144953",
    "knowledgeDensityScore": 93,
    "evidenceRecords": 1
  },
  {
    "id": "singer_allan_fakir",
    "type": "singer",
    "slug": "allan-fakir",
    "name": "Allan Fakir",
    "alternateNames": [],
    "shortDescription": "Iconic Sindhi folk and Sufi singer who embodied the living tradition of Shah Abdul Latif Bhittai's poetry.",
    "longDescription": "Allan Fakir (1932–2000) was a legendary Pakistani Sindhi folk singer and Sufi musician. Born into a poor family in Sindh, he became the most beloved and recognized voice of Sindhi Sufi music. He was renowned for his renditions of Shah Abdul Latif Bhittai's poetry from the 'Shah Jo Risalo'. His distinctive, raw, and deeply spiritual voice, combined with his dancing and dervish-like performance style, made him an icon of Sindhi culture. He performed wearing traditional Sindhi attire and his concerts resembled Sufi gatherings more than formal musical events. He was awarded the Pride of Performance by the Government of Pakistan.",
    "theologicalNotes": "He was considered by many to be a living Fakir — a wandering Sufi mendicant — whose performances were not entertainment but spontaneous acts of devotional remembrance (dhikr).",
    "regionLinks": ["pk"],
    "languageLinks": ["sd"],
    "relatedConcepts": ["shah_jo_risalo", "fakir", "dhikr"],
    "sameAs": ["https://en.wikipedia.org/wiki/Allan_Fakir"],
    "wikidataId": "Q4727131",
    "knowledgeDensityScore": 94,
    "evidenceRecords": 1
  },
  {
    "id": "singer_ahmet_ozhan",
    "type": "singer",
    "slug": "ahmet-ozhan",
    "name": "Ahmet Özhan",
    "alternateNames": [],
    "shortDescription": "Turkey's most celebrated Sufi music vocalist, renowned for performing Ottoman-era ilahis and Mevlevi compositions.",
    "longDescription": "Ahmet Özhan (born 1950) is a Turkish singer, actor, and composer. He is widely regarded as the foremost interpreter of Turkish Sufi music (Tasavvuf Musikisi) and Ottoman classical devotional songs (ilahis). With a career spanning over five decades, he has recorded hundreds of albums and performed at the most prestigious venues in Turkey and internationally. His deep, resonant voice and meticulous adherence to classical Ottoman musical forms have made him the definitive voice of Turkish Sufi devotion. He has performed at Mevlevi Sema ceremonies and is a cultural icon of the Sufi musical heritage of Anatolia.",
    "theologicalNotes": "He preserves and transmits the centuries-old Ottoman Sufi musical canon, particularly the Mevlevi and Halveti traditions, keeping alive a sophisticated art form at risk of being lost to modernization.",
    "regionLinks": ["tr"],
    "languageLinks": ["tr", "ar"],
    "relatedConcepts": ["mevlevi", "ilahi", "tasavvuf_musikisi"],
    "sameAs": ["https://en.wikipedia.org/wiki/Ahmet_%C3%96zhan"],
    "wikidataId": "Q1387753",
    "knowledgeDensityScore": 92,
    "evidenceRecords": 1
  },
  {
    "id": "singer_mercan_dede",
    "type": "singer",
    "slug": "mercan-dede",
    "name": "Mercan Dede",
    "alternateNames": ["Arkin Allen"],
    "shortDescription": "Turkish-Canadian electronic musician and whirling dervish who fused Sufi traditions with techno and ambient music.",
    "longDescription": "Mercan Dede (born Arkin Allen, 1966) is a Turkish-Canadian musician, DJ, visual artist, and Sufi practitioner. He is a pioneer of the electronic Sufi music movement, blending traditional Turkish Sufi instruments (ney, bendir, kudüm) with electronic beats, ambient soundscapes, and techno. He is also a practicing whirling dervish and incorporates Sema (whirling) into his live performances. Based between Istanbul and Montreal, he has released numerous critically acclaimed albums and performed at major festivals worldwide. His work challenges the boundaries between sacred ritual and contemporary art, asking whether ancient mystical practices can be authentically experienced through modern technology.",
    "theologicalNotes": "His radical fusion raises the fundamental Sufi question of form vs. essence — whether the ecstatic state (Hal) can be induced by new instruments and technologies, or whether it is bound to its traditional forms.",
    "regionLinks": ["tr", "ca"],
    "languageLinks": ["tr", "en"],
    "relatedConcepts": ["sema", "electronic_sufi", "ney"],
    "sameAs": ["https://en.wikipedia.org/wiki/Mercan_Dede"],
    "wikidataId": "Q723825",
    "knowledgeDensityScore": 91,
    "evidenceRecords": 1
  },
  {
    "id": "singer_hamza_shakkur",
    "type": "singer",
    "slug": "hamza-shakkur",
    "name": "Hamza Shakkur",
    "alternateNames": [],
    "shortDescription": "Syrian munshid and founder of the Al-Kindi Ensemble, preserving centuries-old Levantine Sufi musical traditions.",
    "longDescription": "Hamza Shakkur is a Syrian munshid (Sufi vocalist/chanter) and the founder and leader of the Al-Kindi Ensemble, based in Damascus. The ensemble specializes in performing the centuries-old musical traditions of the Sufi orders of the Levant (Syria, Iraq, Turkey), including whirling dervish ceremonies, Aleppo-style muwashshahat, and sacred Sufi inshad. Hamza Shakkur has performed at the world's most prestigious music festivals, including WOMAD, and has recorded for the Maison des Cultures du Monde label. His work has been instrumental in preserving and documenting the endangered musical heritage of Syrian Sufism, especially after the devastating Syrian Civil War.",
    "theologicalNotes": "He preserves the specific Levantine Sufi musical traditions — particularly the Qadiri and Rifa'i ceremonial music of Damascus and Aleppo — which represent some of the oldest continuous musical practices in Islam.",
    "regionLinks": ["sy"],
    "languageLinks": ["ar"],
    "relatedConcepts": ["inshad", "muwashshah", "qadiri"],
    "sameAs": ["https://en.wikipedia.org/wiki/Al-Kindi_Ensemble"],
    "wikidataId": "Q4703755",
    "knowledgeDensityScore": 91,
    "evidenceRecords": 1
  },
  {
    "id": "singer_junaid_jamshed",
    "type": "singer",
    "slug": "junaid-jamshed",
    "name": "Junaid Jamshed",
    "alternateNames": ["JJ"],
    "shortDescription": "Pakistani pop icon who left music at the peak of his fame to become one of the most influential nasheed artists.",
    "longDescription": "Junaid Jamshed (1964–2016) was a Pakistani recording artist, songwriter, fashion designer, television host, and preacher. He first gained massive fame as the lead vocalist of the pop band Vital Signs in the late 1980s, with their song 'Dil Dil Pakistan' becoming an unofficial national anthem. At the peak of his pop career, he underwent a profound spiritual transformation, renounced secular music, and dedicated his life to Islamic preaching (Tabligh) and nasheed/naat recitation. His naats, particularly 'Muhammad Ka Roza', became enormously popular globally. He tragically died in the PIA Flight 661 crash in 2016.",
    "theologicalNotes": "His dramatic personal transformation from pop icon to devoted nasheed reciter mirrors the classic Sufi archetype of tawbah (repentance) and complete reorientation of one's life toward the Divine.",
    "regionLinks": ["pk", "global"],
    "languageLinks": ["ur", "en"],
    "relatedConcepts": ["nasheed", "naat", "tawbah"],
    "sameAs": ["https://en.wikipedia.org/wiki/Junaid_Jamshed"],
    "wikidataId": "Q4241965",
    "knowledgeDensityScore": 93,
    "evidenceRecords": 2
  },
  {
    "id": "singer_mahsa_vahdat",
    "type": "singer",
    "slug": "mahsa-vahdat",
    "name": "Mahsa Vahdat",
    "alternateNames": [],
    "shortDescription": "Iranian vocalist who performs Persian Sufi classical poetry despite severe restrictions on women singing in Iran.",
    "longDescription": "Mahsa Vahdat (born 1973) is an Iranian vocalist specializing in Persian classical music and Sufi poetry. Despite the strict prohibition on solo female singing in post-revolutionary Iran, she has become an internationally acclaimed artist, recording and performing globally. She sings the poetry of Rumi, Hafez, and Omar Khayyam set to traditional Persian classical musical forms. Her albums, released through international labels like Kirkelig Kulturverksted (Norway), have received widespread critical acclaim. She often performs with her sister Marjan Vahdat. Her work represents an act of cultural resistance, preserving the ancient Persian Sufi vocal tradition through a female voice that the Iranian state seeks to silence.",
    "theologicalNotes": "Her performances embody the Sufi principle that the divine voice transcends all human-imposed boundaries — including gender, politics, and geography — reclaiming women's historical role in Sufi devotional music.",
    "regionLinks": ["ir"],
    "languageLinks": ["fa"],
    "relatedConcepts": ["persian_classical", "ghazal", "rumi"],
    "sameAs": ["https://en.wikipedia.org/wiki/Mahsa_Vahdat"],
    "wikidataId": "Q4095174",
    "knowledgeDensityScore": 90,
    "evidenceRecords": 1
  },
  {
    "id": "singer_yusuf_islam",
    "type": "singer",
    "slug": "yusuf-islam",
    "name": "Yusuf Islam",
    "alternateNames": ["Cat Stevens", "Yusuf / Cat Stevens"],
    "shortDescription": "British singer-songwriter who converted to Islam, becoming one of the most famous Western voices of Sufi-inspired music.",
    "longDescription": "Yusuf Islam (born Steven Demetre Georgiou, 1948), formerly and still commonly known as Cat Stevens, is a British singer-songwriter and philanthropist. He was one of the biggest pop stars of the 1970s with hits like 'Wild World', 'Peace Train', and 'Morning Has Broken'. In 1977, after a near-drowning experience and a period of spiritual seeking, he converted to Islam, took the name Yusuf Islam, and withdrew from secular music for nearly three decades. He devoted himself to Islamic education and charity, founding several schools. He returned to music in the 2000s, releasing albums that blend his folk-pop style with Islamic spiritual themes and Sufi-inspired lyrics. He was inducted into the Rock and Roll Hall of Fame in 2014.",
    "theologicalNotes": "His journey from global pop stardom through radical renunciation to a reconciliation of music and faith mirrors the Sufi concept of the spiritual journey (suluk) — passing through stages of worldly attachment, detachment, and ultimately divine integration.",
    "regionLinks": ["gb", "global"],
    "languageLinks": ["en"],
    "relatedConcepts": ["suluk", "tawbah", "nasheed"],
    "sameAs": ["https://en.wikipedia.org/wiki/Yusuf_Islam"],
    "wikidataId": "Q131861",
    "knowledgeDensityScore": 95,
    "evidenceRecords": 2
  }
];

const newRelationships = [
  {
    "id": "rel_nfak_rahat",
    "type": "spiritual_lineage",
    "source": "singer_nfak",
    "target": "singer_rahat_fateh_ali_khan",
    "properties": { "context": "Rahat is the nephew and direct protégé of NFAK, trained under him from age seven.", "strength": 100, "verified": true }
  },
  {
    "id": "rel_sabri_nfak",
    "type": "inspired_by",
    "source": "singer_sabri_brothers",
    "target": "singer_nfak",
    "properties": { "context": "The Sabri Brothers pioneered recorded Qawwali, paving the way for NFAK's global career.", "strength": 85, "verified": true }
  },
  {
    "id": "rel_nfak_hans",
    "type": "spiritual_mentor",
    "source": "singer_nfak",
    "target": "singer_hans_raj_hans",
    "properties": { "context": "Hans Raj Hans was a direct disciple of NFAK.", "strength": 95, "verified": true }
  },
  {
    "id": "rel_abida_latif",
    "type": "performs_works_of",
    "source": "singer_abida_parveen",
    "target": "person_sachal_sarmast",
    "properties": { "context": "Abida Parveen is the foremost living interpreter of Sachal Sarmast's Sindhi poetry.", "strength": 90, "verified": true }
  },
  {
    "id": "rel_sabri_tajdar",
    "type": "performs_works_of",
    "source": "singer_sabri_brothers",
    "target": "person_moinuddin_chishti",
    "properties": { "context": "The Sabri Brothers' iconic 'Tajdar-e-Haram' is dedicated to Moinuddin Chishti.", "strength": 95, "verified": true }
  }
];

// Add to constitutional core
newSingers.forEach(s => {
  if (!core.find(c => c.slug === s.slug)) {
    core.push({
      "class": "singers",
      "slug": s.slug,
      "name": s.name,
      "aliases": s.alternateNames,
      "canonicalImpact": s.shortDescription,
      "readinessScore": s.knowledgeDensityScore,
      "resilienceScore": 90,
      "confidenceLayer": "High",
      "verificationStatus": "Verified",
      "evidenceRecords": s.evidenceRecords,
      "disputeStatus": "None",
      "relatedQuestions": []
    });
  }
});

// Add to registry
newSingers.forEach(s => {
  if (!registry.find(r => r.slug === s.slug || r.id === s.id)) {
    registry.push(s);
  }
});

// Add relationships
newRelationships.forEach(r => {
  if (!rels.find(rel => rel.id === r.id)) {
    rels.push(r);
  }
});

fs.writeFileSync(corePath, JSON.stringify(core, null, 2));
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
fs.writeFileSync(relsPath, JSON.stringify(rels, null, 2));

console.log(`Enriched registry with ${newSingers.length} Sufi singers and ${newRelationships.length} relationships.`);

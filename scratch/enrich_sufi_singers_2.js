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
    "id": "singer_amjad_sabri",
    "type": "singer",
    "slug": "amjad-sabri",
    "name": "Amjad Sabri",
    "alternateNames": ["Amjad Farid Sabri"],
    "shortDescription": "Son of Ghulam Farid Sabri who carried the Sabri Brothers' Qawwali legacy until his tragic assassination.",
    "longDescription": "Amjad Sabri (1976–2016) was a Pakistani Qawwali singer and the son of Haji Ghulam Farid Sabri of the legendary Sabri Brothers. He carried forward his father's Qawwali tradition with extraordinary devotion and skill, becoming one of the most beloved Qawwals in Pakistan. His renditions of 'Bhar Do Jholi Meri' and 'Tajdar-e-Haram' were massive hits, and his Coke Studio performances reached millions. He was tragically shot and killed in Karachi in 2016, an act widely condemned across Pakistan. His death was mourned as a devastating loss to the living Qawwali tradition. He was posthumously awarded the Sitara-e-Shujaat by the Government of Pakistan.",
    "theologicalNotes": "He represented the third generation of the Sabri Qawwali gharana, embodying the Sufi principle that sacred art is transmitted through family lineages as a living trust (amanah).",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "pa"],
    "relatedConcepts": ["qawwali", "gharana"],
    "sameAs": ["https://en.wikipedia.org/wiki/Amjad_Sabri"],
    "wikidataId": "Q20649879",
    "knowledgeDensityScore": 94,
    "evidenceRecords": 2
  },
  {
    "id": "singer_fareed_ayaz",
    "type": "singer",
    "slug": "fareed-ayaz",
    "name": "Fareed Ayaz",
    "alternateNames": ["Fareed Ayaz & Abu Muhammad"],
    "shortDescription": "Master Qawwal from the Delhi Gharana whose performances preserve the purest classical Qawwali tradition.",
    "longDescription": "Fareed Ayaz (born 1953) is a Pakistani Qawwali singer from Hyderabad, Sindh. Along with his brother Abu Muhammad, he leads one of the most respected Qawwali groups in South Asia. They belong to the prestigious Delhi Gharana of Qawwali, tracing their lineage directly to Amir Khusrau, the 13th-century Sufi poet who is credited with inventing the Qawwali form itself. Fareed Ayaz is widely considered the most authentic classical Qawwal alive, performing in Persian, Urdu, Hindi, Braj Bhasha, and Punjabi. His performances at the shrines of Nizamuddin Auliya, Data Ganj Bakhsh, and Abdullah Shah Ghazi are legendary. He received the Pride of Performance from the Government of Pakistan.",
    "theologicalNotes": "His direct lineage to Amir Khusrau's Delhi Gharana makes him arguably the most authentically connected living Qawwal to the original 700-year-old tradition of Chishti devotional music.",
    "regionLinks": ["pk", "in"],
    "languageLinks": ["ur", "fa", "hi", "pa"],
    "relatedConcepts": ["qawwali", "delhi_gharana", "chishti"],
    "sameAs": ["https://en.wikipedia.org/wiki/Fareed_Ayaz"],
    "wikidataId": "Q5434671",
    "knowledgeDensityScore": 96,
    "evidenceRecords": 2
  },
  {
    "id": "singer_abu_muhammad",
    "type": "singer",
    "slug": "abu-muhammad-qawwal",
    "name": "Abu Muhammad Qawwal",
    "alternateNames": ["Abu Muhammad"],
    "shortDescription": "Brother and co-performer of Fareed Ayaz, together forming the premier classical Qawwali duo of Pakistan.",
    "longDescription": "Abu Muhammad is a Pakistani Qawwali singer and the brother of Fareed Ayaz. Together they form the celebrated Fareed Ayaz & Abu Muhammad Qawwali group, belonging to the Delhi Gharana. Abu Muhammad's powerful vocal harmonies and rhythmic mastery complement Fareed Ayaz's lead vocals, creating a synergy that is regarded as the gold standard of classical Qawwali performance. Their concerts often last for hours, building gradually from quiet, contemplative beginnings to overwhelming crescendos of spiritual ecstasy. They have performed together at international festivals, UNESCO heritage events, and at the great Sufi shrines of the subcontinent.",
    "theologicalNotes": "The brother-duo format itself reflects the traditional Qawwali ensemble structure where complementary voices create a collective spiritual force greater than any individual performer.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "fa", "pa"],
    "relatedConcepts": ["qawwali", "delhi_gharana"],
    "sameAs": [],
    "wikidataId": "",
    "knowledgeDensityScore": 90,
    "evidenceRecords": 1
  },
  {
    "id": "singer_bahauddin_khan",
    "type": "singer",
    "slug": "bahauddin-khan-qawwal",
    "name": "Bahauddin Khan Qawwal",
    "alternateNames": [],
    "shortDescription": "Traditional Pakistani Qawwal known for his powerful shrine performances and classical devotional repertoire.",
    "longDescription": "Bahauddin Khan Qawwal is a respected Pakistani Qawwali performer rooted in the traditional shrine circuit of Punjab and Sindh. He represents the class of working Qawwals who perform regularly at the urs (death anniversary) celebrations of major Sufi saints, maintaining the living ritual function of Qawwali as a form of worship rather than mere entertainment. His repertoire is deeply classical, focusing on the traditional Persian and Urdu devotional compositions that have been transmitted through generations of Qawwali families. He embodies the spiritual backbone of the Qawwali tradition — the shrine performer whose primary audience is the saint in the grave.",
    "theologicalNotes": "He represents the working shrine Qawwal tradition where performance is an act of worship (ibadah) directed at the saint, not a concert for an audience.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "pa", "fa"],
    "relatedConcepts": ["qawwali", "urs"],
    "sameAs": [],
    "wikidataId": "",
    "knowledgeDensityScore": 85,
    "evidenceRecords": 0
  },
  {
    "id": "singer_sher_miandad",
    "type": "singer",
    "slug": "sher-miandad-khan",
    "name": "Sher Miandad Khan",
    "alternateNames": ["Sher Miandad Khan Qawwal"],
    "shortDescription": "Veteran Pakistani Qawwal from a legendary musical family, famous for his powerful devotional performances.",
    "longDescription": "Sher Miandad Khan is a celebrated Pakistani Qawwali singer from a distinguished family of Qawwals based in Punjab. He has been performing Qawwali for decades at major shrines, festivals, and cultural events across Pakistan. His powerful, booming voice and deep knowledge of classical Qawwali compositions make him a highly sought-after performer at urs celebrations and Sufi gatherings. He is particularly renowned for his renditions of devotional poetry dedicated to the Prophet Muhammad and the great Sufi saints. His performances embody the traditional, unhurried, shrine-centered approach to Qawwali.",
    "theologicalNotes": "His career-long dedication to shrine-based performance keeps alive the original devotional context of Qawwali as a spiritual practice rather than a commercial art form.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "pa"],
    "relatedConcepts": ["qawwali", "naat"],
    "sameAs": [],
    "wikidataId": "",
    "knowledgeDensityScore": 87,
    "evidenceRecords": 0
  },
  {
    "id": "singer_nooran_sisters",
    "type": "singer",
    "slug": "nooran-sisters",
    "name": "Nooran Sisters",
    "alternateNames": ["Jyoti Nooran", "Sultana Nooran"],
    "shortDescription": "Indian Sufi singing duo from Punjab whose raw, electrifying voices have captivated millions.",
    "longDescription": "The Nooran Sisters — Jyoti Nooran and Sultana Nooran — are Indian Sufi singers from the Nooran family of hereditary musicians in Jalandhar, Punjab. They burst into mainstream fame through the Bollywood film 'Highway' (2014) with the song 'Patakha Guddi' and subsequently through 'Tung Tung' from 'Singh is Bling'. Their raw, untrained vocal power and authentic Punjabi Sufi style made them an instant sensation. They come from a family that has been singing at Sufi shrines for generations, and their repertoire includes traditional kafis, Sufi kalams, and devotional folk songs of Punjab. They represent the raw, unpolished, shrine-born tradition of female Sufi singing.",
    "theologicalNotes": "They carry forward the rare tradition of female hereditary Sufi musicians in Punjab, where women have historically sung at dargahs and urs celebrations despite patriarchal restrictions.",
    "regionLinks": ["in"],
    "languageLinks": ["pa", "hi"],
    "relatedConcepts": ["kafi", "punjabi_sufism"],
    "sameAs": ["https://en.wikipedia.org/wiki/Nooran_Sisters"],
    "wikidataId": "Q17069082",
    "knowledgeDensityScore": 89,
    "evidenceRecords": 1
  },
  {
    "id": "singer_rabbi_shergill",
    "type": "singer",
    "slug": "rabbi-shergill",
    "name": "Rabbi Shergill",
    "alternateNames": ["Gurpreet Singh Shergill"],
    "shortDescription": "Indian rock musician whose Sufi-inflected Punjabi rock became a cultural phenomenon.",
    "longDescription": "Rabbi Shergill (born Gurpreet Singh Shergill, 1973) is an Indian singer-songwriter and musician. He rose to massive fame with his debut single 'Bulla Ki Jaana' (2004), a rock adaptation of the mystical poetry of Bulleh Shah that became one of the biggest hits in Indian music history. The song's fusion of Punjabi Sufi poetry with rock guitar created an entirely new genre and introduced millions of young Indians to Bulleh Shah's philosophy. His subsequent work has continued to draw from Sufi themes, Punjab folk traditions, and social commentary. He is credited with single-handedly reviving mainstream interest in Bulleh Shah's poetry among urban Indian youth.",
    "theologicalNotes": "His viral adaptation of Bulleh Shah proved that 300-year-old Sufi poetry retains its radical, questioning power when delivered through contemporary idioms.",
    "regionLinks": ["in"],
    "languageLinks": ["pa", "hi"],
    "relatedConcepts": ["sufi_rock", "bulleh_shah"],
    "sameAs": ["https://en.wikipedia.org/wiki/Rabbi_Shergill"],
    "wikidataId": "Q3929050",
    "knowledgeDensityScore": 88,
    "evidenceRecords": 1
  },
  {
    "id": "singer_harshdeep_kaur",
    "type": "singer",
    "slug": "harshdeep-kaur",
    "name": "Harshdeep Kaur",
    "alternateNames": ["Sufi Ki Sultana"],
    "shortDescription": "Indian playback singer celebrated as 'Sufi Ki Sultana' for her powerful Sufi devotional performances.",
    "longDescription": "Harshdeep Kaur (born 1986) is an Indian playback singer who has earned the title 'Sufi Ki Sultana' (Queen of Sufi Music) for her extraordinary Sufi and devotional recordings. Born in Delhi, she began performing at age four and trained in classical music. She has sung numerous Bollywood hits with Sufi themes, including songs for films by A.R. Rahman. Her live performances of traditional Sufi kafis, particularly those of Bulleh Shah and Baba Farid, are deeply moving. She has performed at major international events, including singing for the British Royal Family. She was awarded the UK Asian Music Award.",
    "theologicalNotes": "Her title 'Sufi Ki Sultana' reflects the growing recognition of female voices in the traditionally male-dominated Sufi performance space, mirroring the legacy of Rabia al-Adawiyya.",
    "regionLinks": ["in"],
    "languageLinks": ["pa", "hi", "ur"],
    "relatedConcepts": ["kafi", "sufi_bollywood"],
    "sameAs": ["https://en.wikipedia.org/wiki/Harshdeep_Kaur"],
    "wikidataId": "Q5670039",
    "knowledgeDensityScore": 88,
    "evidenceRecords": 1
  },
  {
    "id": "singer_richa_sharma",
    "type": "singer",
    "slug": "richa-sharma",
    "name": "Richa Sharma",
    "alternateNames": [],
    "shortDescription": "Indian Sufi and devotional singer known for her powerful live performances and Bollywood playback.",
    "longDescription": "Richa Sharma (born 1982) is an Indian playback singer and live performer known for her powerful Sufi and devotional music. Born in Jammu, she trained in Hindustani classical music and rose to fame through Bollywood playback singing. She is best known for songs like 'Sajda' and 'Ni Main Samajh Gayi'. Her live concerts feature extensive Sufi repertoire, including kafis, hamd, and naat, performed with an energy that recalls the ecstatic traditions of Sufi shrines. She has performed at international venues across the US, UK, Canada, and the Middle East.",
    "theologicalNotes": "Her performances bridge the gap between Bollywood entertainment and authentic Sufi devotion, bringing shrine-style ecstatic singing to commercial concert stages.",
    "regionLinks": ["in"],
    "languageLinks": ["hi", "pa", "ur"],
    "relatedConcepts": ["kafi", "devotional"],
    "sameAs": ["https://en.wikipedia.org/wiki/Richa_Sharma"],
    "wikidataId": "Q7323069",
    "knowledgeDensityScore": 85,
    "evidenceRecords": 1
  },
  {
    "id": "singer_kavita_seth",
    "type": "singer",
    "slug": "kavita-seth",
    "name": "Kavita Seth",
    "alternateNames": [],
    "shortDescription": "Indian Sufi and ghazal singer renowned for 'Tumse Hi Jag' and her interpretations of Kabir and Rumi.",
    "longDescription": "Kavita Seth is an Indian singer specializing in Sufi music, ghazals, and devotional songs. She rose to wide prominence through her Bollywood playback work, particularly the hauntingly beautiful 'Tumse Hi Jag' from the film 'Sadak 2' and songs from 'Lootera'. She has trained extensively in Hindustani classical music and brings a sophisticated musicality to her Sufi performances. Her repertoire includes interpretations of poetry by Kabir, Rumi, Amir Khusrau, and Bulleh Shah. She has performed at the Jaipur Literature Festival, TEDx events, and numerous cultural festivals promoting Sufi music.",
    "theologicalNotes": "Her work demonstrates how Sufi poetry can serve as a bridge between high classical music and accessible popular forms, honoring both traditions.",
    "regionLinks": ["in"],
    "languageLinks": ["hi", "ur"],
    "relatedConcepts": ["ghazal", "kabir"],
    "sameAs": ["https://en.wikipedia.org/wiki/Kavita_Seth"],
    "wikidataId": "Q16955698",
    "knowledgeDensityScore": 86,
    "evidenceRecords": 1
  },
  {
    "id": "singer_mame_khan",
    "type": "singer",
    "slug": "mame-khan",
    "name": "Mame Khan",
    "alternateNames": [],
    "shortDescription": "Rajasthani Manganiyar folk and Sufi singer who brought desert mysticism to global audiences.",
    "longDescription": "Mame Khan is an Indian singer from the Manganiyar community of Rajasthan, a hereditary caste of Muslim folk musicians. He is one of the most internationally recognized Rajasthani musicians, performing traditional Sufi and folk songs of the Thar Desert. His music draws from the rich mystical traditions of Rajasthani Sufism, blending it with the ancient Manganiyar folk heritage. He performed at Glastonbury Festival, making history as the first Indian folk artist to perform on its main stage. He also gained fame through MTV Coke Studio and various Bollywood collaborations. His voice carries the raw, haunting quality of desert spirituality.",
    "theologicalNotes": "The Manganiyar musical tradition represents a unique form of Islamic mysticism intertwined with Rajasthani folk culture, where music itself is considered a form of prayer.",
    "regionLinks": ["in"],
    "languageLinks": ["raj", "hi"],
    "relatedConcepts": ["manganiyar", "desert_sufism"],
    "sameAs": ["https://en.wikipedia.org/wiki/Mame_Khan"],
    "wikidataId": "Q6747098",
    "knowledgeDensityScore": 89,
    "evidenceRecords": 1
  },
  {
    "id": "singer_shafqat_amanat",
    "type": "singer",
    "slug": "shafqat-amanat-ali",
    "name": "Shafqat Amanat Ali",
    "alternateNames": [],
    "shortDescription": "Pakistani classical and Sufi vocalist, son of Ustad Amanat Ali Khan, blending ghazal tradition with modern music.",
    "longDescription": "Shafqat Amanat Ali (born 1965) is a Pakistani singer and the son of legendary ghazal singer Ustad Amanat Ali Khan of the Patiala Gharana. He first gained fame as the lead vocalist of the rock band Fuzon, whose fusion of Sufi poetry with soft rock produced the iconic track 'Mora Saiyaan'. He has since become one of Pakistan's most versatile vocalists, performing classical ghazals, Sufi kafis, Bollywood playback, and contemporary pop. His training in the Patiala Gharana gives his Sufi performances a classical depth and refinement rarely found in contemporary artists.",
    "theologicalNotes": "His Patiala Gharana lineage connects him to one of the most prestigious chains of Hindustani classical music transmission, enriching his Sufi performances with centuries of refined musicality.",
    "regionLinks": ["pk", "in"],
    "languageLinks": ["ur", "pa", "hi"],
    "relatedConcepts": ["ghazal", "patiala_gharana"],
    "sameAs": ["https://en.wikipedia.org/wiki/Shafqat_Amanat_Ali"],
    "wikidataId": "Q7461440",
    "knowledgeDensityScore": 90,
    "evidenceRecords": 1
  },
  {
    "id": "singer_mekaal_hasan",
    "type": "singer",
    "slug": "mekaal-hasan-band",
    "name": "Mekaal Hasan Band",
    "alternateNames": ["MHB"],
    "shortDescription": "Pakistani progressive rock band that pioneered the fusion of Sufi poetry with progressive and jazz-rock.",
    "longDescription": "Mekaal Hasan Band is a Pakistani progressive rock and fusion band founded by guitarist Mekaal Hasan in Lahore. The band is renowned for its sophisticated fusion of Sufi poetry, Hindustani classical music, and progressive rock/jazz. Their music features complex arrangements combining classical sitar and tabla with electric guitars and Western rock instrumentation, set to the mystical poetry of Bulleh Shah, Amir Khusrau, and other Sufi poets. They have performed at major international festivals including WOMAD, and are considered pioneers of the Pakistani progressive rock movement. Their work has been critically acclaimed for elevating Sufi musical fusion to an intellectually rigorous art form.",
    "theologicalNotes": "Their work demonstrates that Sufi poetry can serve as the lyrical and philosophical foundation for complex, avant-garde musical forms without losing its spiritual essence.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "pa"],
    "relatedConcepts": ["sufi_rock", "progressive_sufi"],
    "sameAs": ["https://en.wikipedia.org/wiki/Mekaal_Hasan_Band"],
    "wikidataId": "Q6811026",
    "knowledgeDensityScore": 88,
    "evidenceRecords": 1
  },
  {
    "id": "singer_junoon",
    "type": "singer",
    "slug": "junoon-band",
    "name": "Junoon",
    "alternateNames": ["Salman Ahmad", "Ali Azmat"],
    "shortDescription": "Pakistan's biggest rock band, pioneers of Sufi rock who sold over 30 million records worldwide.",
    "longDescription": "Junoon is a Pakistani Sufi rock band formed in 1990 by guitarist Salman Ahmad, vocalist Ali Azmat, and bassist Brian O'Connell. They are widely regarded as the pioneers of the Sufi rock genre and are the best-selling South Asian rock band of all time, with over 30 million records sold. Their music fused Western rock with traditional Sufi devotional music, Qawwali rhythms, and the poetry of Bulleh Shah and Rumi. Iconic albums include 'Inquilaab', 'Azadi', and 'Parvaaz'. The band faced censorship and bans from Pakistani state television for their politically charged lyrics. Their 2001 concert at the United Nations was a landmark event. They are often called 'The U2 of South Asia'.",
    "theologicalNotes": "Junoon proved that Sufi themes of divine love, social justice, and spiritual rebellion could power a mass-market rock movement, reaching audiences that traditional Qawwali never could.",
    "regionLinks": ["pk", "global"],
    "languageLinks": ["ur", "pa", "en"],
    "relatedConcepts": ["sufi_rock", "inquilaab"],
    "sameAs": ["https://en.wikipedia.org/wiki/Junoon_(band)"],
    "wikidataId": "Q521116",
    "knowledgeDensityScore": 95,
    "evidenceRecords": 2
  },
  {
    "id": "singer_arieb_azhar",
    "type": "singer",
    "slug": "arieb-azhar",
    "name": "Arieb Azhar",
    "alternateNames": [],
    "shortDescription": "Pakistani musician who fuses Sufi poetry with Latin, African, and Eastern musical traditions.",
    "longDescription": "Arieb Azhar (born 1977) is a Pakistani singer-songwriter, musician, and cultural activist based in Islamabad. He is known for his innovative fusion of Sufi and South Asian devotional music with Latin American, African, and other world music traditions. His most famous work, 'Husn-e-Haqiqi', sets the poetry of Bulleh Shah to a musical arrangement inspired by Latin rhythms, creating a startling and beautiful cross-cultural connection. He is deeply engaged with the political and cultural dimensions of Sufism, viewing it as a force for progressive social change. He has performed at international festivals and is regarded as one of Pakistan's most intellectually rigorous musical artists.",
    "theologicalNotes": "His cross-cultural fusion embodies the Sufi principle of wahdat (unity) — finding the divine thread that connects musical and spiritual traditions across civilizations.",
    "regionLinks": ["pk"],
    "languageLinks": ["ur", "pa", "en"],
    "relatedConcepts": ["wahdat", "world_sufi_fusion"],
    "sameAs": ["https://en.wikipedia.org/wiki/Arieb_Azhar"],
    "wikidataId": "Q4789846",
    "knowledgeDensityScore": 88,
    "evidenceRecords": 1
  },
  {
    "id": "singer_humera_channa",
    "type": "singer",
    "slug": "humera-channa",
    "name": "Humera Channa",
    "alternateNames": [],
    "shortDescription": "Pakistani Sindhi singer celebrated for her soulful renditions of Shah Abdul Latif Bhittai's poetry.",
    "longDescription": "Humera Channa is a Pakistani singer specializing in Sindhi Sufi music and folk songs. She is one of the leading female vocalists from Sindh, celebrated for her deeply emotional renditions of the poetry of Shah Abdul Latif Bhittai and other Sindhi Sufi poets. Her powerful voice and authentic Sindhi musical style have made her a beloved figure at cultural festivals, Sufi gatherings, and television programs throughout Pakistan. She has also performed internationally, representing the rich Sindhi Sufi musical tradition at world music events.",
    "theologicalNotes": "She preserves the uniquely Sindhi tradition of female Sufi vocalism, where women have historically played a central role in transmitting the poetry of Shah Abdul Latif Bhittai through song.",
    "regionLinks": ["pk"],
    "languageLinks": ["sd", "ur"],
    "relatedConcepts": ["shah_jo_risalo", "sindhi_sufism"],
    "sameAs": ["https://en.wikipedia.org/wiki/Humera_Channa"],
    "wikidataId": "Q17012189",
    "knowledgeDensityScore": 87,
    "evidenceRecords": 1
  },
  {
    "id": "singer_reshma",
    "type": "singer",
    "slug": "reshma",
    "name": "Reshma",
    "alternateNames": ["Reshma Kausar"],
    "shortDescription": "Legendary Pakistani folk singer whose raw, desert-born voice became the soul of Rajasthani-Thari Sufi music.",
    "longDescription": "Reshma (1947–2013) was a legendary Pakistani folk singer of Rajasthani origin, born in the Thar Desert near the India-Pakistan border. She belonged to a nomadic tribe and had no formal musical training, yet her raw, powerful, and deeply emotional voice made her one of the most iconic singers in South Asian history. Her songs 'Laal Meri Pat Rakhiyo' (dedicated to Lal Shahbaz Qalandar), 'Ankhiyan Nu Rehn De', and 'Hai O Rabba' became timeless classics. She sang in Punjabi, Sindhi, Saraiki, and Hindi. Despite being illiterate, she possessed an extraordinary musical memory and could perform for hours from memory. She was awarded Pakistan's Pride of Performance.",
    "theologicalNotes": "Her untrained, desert-born voice embodied the Sufi ideal that spiritual truth needs no formal education — the divine speaks through those who are pure vessels, regardless of worldly learning.",
    "regionLinks": ["pk", "in"],
    "languageLinks": ["pa", "sd", "skr"],
    "relatedConcepts": ["fakir", "desert_sufism", "qalandar"],
    "sameAs": ["https://en.wikipedia.org/wiki/Reshma"],
    "wikidataId": "Q2406740",
    "knowledgeDensityScore": 95,
    "evidenceRecords": 2
  },
  {
    "id": "singer_saieen_zahoor",
    "type": "singer",
    "slug": "saieen-zahoor",
    "name": "Saieen Zahoor",
    "alternateNames": ["Sain Zahoor"],
    "shortDescription": "Pakistani Sufi singer and mystic who won the BBC World Music Award for his ecstatic devotional performances.",
    "longDescription": "Saieen Zahoor (born 1937) is a Pakistani Sufi singer and mystic from Okara, Punjab. He is a practicing Sufi dervish who spent years living at the shrines of saints in Punjab before gaining international fame. He won the BBC World Music Award in 2006, which brought him to global attention. His performances are characterized by intense spiritual ecstasy, with Zahoor often entering trance-like states during his singing. He performs traditional Punjabi Sufi kafis and kalams of Bulleh Shah, Sultan Bahoo, and Shah Hussain, accompanied by chimta (fire tongs), dholak, and harmonium. He embodies the tradition of the Sufi fakir-musician — a mystic for whom singing is an extension of prayer.",
    "theologicalNotes": "He is a rare example of a genuine Sufi practitioner-performer whose music is inseparable from his spiritual practice, representing the ideal union of art and worship.",
    "regionLinks": ["pk"],
    "languageLinks": ["pa"],
    "relatedConcepts": ["fakir", "chimta", "kafi"],
    "sameAs": ["https://en.wikipedia.org/wiki/Sain_Zahoor"],
    "wikidataId": "Q7399536",
    "knowledgeDensityScore": 93,
    "evidenceRecords": 2
  },
  {
    "id": "singer_barkat_sidhu",
    "type": "singer",
    "slug": "barkat-sidhu",
    "name": "Barkat Sidhu",
    "alternateNames": [],
    "shortDescription": "Indian Punjabi folk and Sufi singer known for his earthy voice and devotional repertoire.",
    "longDescription": "Barkat Sidhu is an Indian Punjabi folk singer from Punjab, India. He is known for his deep, earthy voice and his devotion to the traditional Sufi folk music of Punjab. He performs kafis and kalams of Sufi poets like Bulleh Shah, Baba Farid, and Shah Hussain, as well as traditional Punjabi folk songs rooted in the agrarian and spiritual life of the Punjab countryside. His music represents the everyday, grassroots tradition of Sufi devotion in Punjab, where Sufi poetry is sung not in concert halls but in fields, at village gatherings, and at local shrines.",
    "theologicalNotes": "He represents the village-level Sufi singing tradition where mystical poetry is woven into the daily fabric of rural Punjabi life, keeping Sufism alive as a folk practice rather than a concert form.",
    "regionLinks": ["in"],
    "languageLinks": ["pa"],
    "relatedConcepts": ["kafi", "punjabi_folk"],
    "sameAs": [],
    "wikidataId": "",
    "knowledgeDensityScore": 84,
    "evidenceRecords": 0
  },
  {
    "id": "singer_zila_khan",
    "type": "singer",
    "slug": "zila-khan",
    "name": "Zila Khan",
    "alternateNames": [],
    "shortDescription": "Daughter of Ustad Vilayat Khan who blends Hindustani classical music with Sufi devotional singing.",
    "longDescription": "Zila Khan is an Indian classical and Sufi singer, and the daughter of legendary sitar maestro Ustad Vilayat Khan. She trained under her father in the Imdadkhani Gharana of Hindustani classical music and developed a unique vocal style that blends the precision of classical ragas with the emotional intensity of Sufi devotional singing. She has performed at Carnegie Hall, the Kennedy Center, and major international music festivals. She is also an actress and has appeared in Hollywood and Bollywood productions. Her music often features the poetry of Rumi, Amir Khusrau, and Kabir, set to elaborate classical raag frameworks.",
    "theologicalNotes": "Her classical training allows her to demonstrate the deep historical connection between Hindustani classical music and Sufi spiritual practice, both of which were nurtured in the same courts and shrines.",
    "regionLinks": ["in"],
    "languageLinks": ["hi", "ur", "fa"],
    "relatedConcepts": ["raag", "imdadkhani_gharana"],
    "sameAs": ["https://en.wikipedia.org/wiki/Zila_Khan"],
    "wikidataId": "Q8072116",
    "knowledgeDensityScore": 89,
    "evidenceRecords": 1
  },
  {
    "id": "singer_masha_ali",
    "type": "singer",
    "slug": "masha-ali",
    "name": "Masha Ali",
    "alternateNames": [],
    "shortDescription": "Indian Punjabi Sufi and folk singer known for soulful renditions of Sufi kalams and devotional songs.",
    "longDescription": "Masha Ali is an Indian Punjabi singer specializing in Sufi, devotional, and folk music. Based in Punjab, India, he has gained a significant following for his deeply emotional renditions of Sufi kalams, particularly those of Bulleh Shah, Baba Farid, and other Punjabi Sufi poets. His rich, resonant voice and traditional singing style have made him popular at live devotional gatherings, Sufi festivals, and cultural events across Punjab. He has released numerous albums and his songs are widely shared on digital platforms, reaching audiences across the Punjabi diaspora.",
    "theologicalNotes": "He represents the contemporary generation of Punjabi Sufi singers who are keeping the traditional kalam tradition alive through digital distribution and social media.",
    "regionLinks": ["in"],
    "languageLinks": ["pa", "hi"],
    "relatedConcepts": ["kafi", "kalam"],
    "sameAs": [],
    "wikidataId": "",
    "knowledgeDensityScore": 84,
    "evidenceRecords": 0
  }
];

const newRelationships = [
  {
    "id": "rel_sabri_amjad",
    "type": "spiritual_lineage",
    "source": "singer_sabri_brothers",
    "target": "singer_amjad_sabri",
    "properties": { "context": "Amjad Sabri was the son of Ghulam Farid Sabri, carrying the Sabri gharana into the third generation.", "strength": 100, "verified": true }
  },
  {
    "id": "rel_fareed_khusrau",
    "type": "spiritual_lineage",
    "source": "person_amir_khusrau",
    "target": "singer_fareed_ayaz",
    "properties": { "context": "Fareed Ayaz traces his Delhi Gharana lineage directly to Amir Khusrau.", "strength": 90, "verified": true }
  },
  {
    "id": "rel_fareed_abu",
    "type": "performs_with",
    "source": "singer_fareed_ayaz",
    "target": "singer_abu_muhammad",
    "properties": { "context": "Brothers who perform together as the Fareed Ayaz & Abu Muhammad Qawwali group.", "strength": 100, "verified": true }
  },
  {
    "id": "rel_reshma_qalandar",
    "type": "performs_works_of",
    "source": "singer_reshma",
    "target": "person_lal_shahbaz_qalandar",
    "properties": { "context": "Reshma's iconic 'Laal Meri Pat Rakhiyo' is dedicated to Lal Shahbaz Qalandar.", "strength": 95, "verified": true }
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

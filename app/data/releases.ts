export interface Release {
  id: string;
  slug: string;
  title: string;
  titleUrdu: string;
  writer: {
    name: string;
    nameUrdu: string;
  };
  vocalist: {
    name: string;
    nameUrdu: string;
  };
  producer: {
    name: string;
  };
  releaseDate: string;
  coverImage: string;
  youtubeId: string;
  description: string;
  lyrics: Array<{
    urdu: string;
    transliteration: string;
    translation: string;
    timestamp: string;
  }>;
}

export const releases: Release[] = [
  {
    id: '1',
    slug: 'mujhe-ishq-hai',
    title: 'Mujhe Ishq Hai',
    titleUrdu: 'مجھے عشق ہے',
    writer: {
      name: 'Ahmed Hassan',
      nameUrdu: 'احمد حسن'
    },
    vocalist: {
      name: 'Fatima Zahra',
      nameUrdu: 'فاطمہ زہرا'
    },
    producer: {
      name: 'Ali Raza'
    },
    releaseDate: '2024-03-15',
    coverImage: 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeId: 'dQw4w9WgXcQ',
    description: 'A soulful exploration of divine love and spiritual yearning, expressed through classical Sufi poetry.',
    lyrics: [
      {
        urdu: 'مجھے عشق ہے تجھ سے اے میرے مولا',
        transliteration: 'Mujhe ishq hai tujh se ae mere maula',
        translation: 'I am in love with You, O my Master',
        timestamp: '0:15'
      },
      {
        urdu: 'تیرے در پہ آیا ہوں میں سائل بن کر',
        transliteration: 'Tere dar pe aaya hun main sail ban kar',
        translation: 'I have come to Your door as a beggar',
        timestamp: '0:45'
      }
    ]
  },
  {
    id: '2',
    slug: 'dil-ki-baat',
    title: 'Dil Ki Baat',
    titleUrdu: 'دل کی بات',
    writer: {
      name: 'Sara Khan',
      nameUrdu: 'سارہ خان'
    },
    vocalist: {
      name: 'Usman Ali',
      nameUrdu: 'عثمان علی'
    },
    producer: {
      name: 'Hamza Malik'
    },
    releaseDate: '2024-02-28',
    coverImage: 'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeId: 'dQw4w9WgXcQ',
    description: 'A heartfelt conversation with the Divine, exploring themes of surrender and devotion.',
    lyrics: [
      {
        urdu: 'دل کی بات زبان پہ آ نہ سکی',
        transliteration: 'Dil ki baat zubaan pe aa na saki',
        translation: "The heart's message could not reach the tongue",
        timestamp: '0:20'
      }
    ]
  },
  {
    id: '3',
    slug: 'raah-e-mohabbat',
    title: 'Raah-e-Mohabbat',
    titleUrdu: 'راہِ محبت',
    writer: {
      name: 'Zainab Ahmed',
      nameUrdu: 'زینب احمد'
    },
    vocalist: {
      name: 'Hassan Mahmood',
      nameUrdu: 'حسن محمود'
    },
    producer: {
      name: 'Bilal Sheikh'
    },
    releaseDate: '2024-01-20',
    coverImage: 'https://images.pexels.com/photos/1261180/pexels-photo-1261180.jpeg?auto=compress&cs=tinysrgb&w=800',
    youtubeId: 'dQw4w9WgXcQ',
    description: 'Journey through the path of divine love, inspired by classical Sufi traditions.',
    lyrics: [
      {
        urdu: 'راہِ محبت میں قدم رکھا ہے',
        transliteration: 'Raah-e-mohabbat mein qadam rakha hai',
        translation: 'I have stepped on the path of love',
        timestamp: '0:18'
      }
    ]
  }
];

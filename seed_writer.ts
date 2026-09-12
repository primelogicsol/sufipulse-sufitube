import { entityCreate, entityGetAll } from './lib/entity-storage-server';

const existing = entityGetAll('writers').find((w: any) => w.public_name === 'Dr. Zarf-e-Noori' || w.name === 'Dr. Zarf-e-Noori');
if (!existing) {
  const writer = entityCreate('writers', {
    public_name: 'Dr. Zarf-e-Noori',
    pen_name: 'Zarf-e-Noori',
    public_credit: 'Dr. Zarf-e-Noori',
    profile_status: 'approved_as_writer',
    contributor_status: 'ACTIVE',
    writer_category: 'Founding / Internal Writer',
    affiliation: 'SufiPulse Studio USA',
    roles: ['Writer', 'Lyricist', 'Composer', 'Music Director'],
    primary_languages: ['Urdu', 'English', 'Persian', 'Kashmiri'],
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  console.log('Created canonical writer:', writer.id);
} else {
  console.log('Already exists:', existing.id);
}

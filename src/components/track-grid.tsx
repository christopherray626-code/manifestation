import { router } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { ShelfCard } from '@/components/art';
import { Chip, ChipRow, Section } from '@/components/ui';
import { trackById, TRACK_GROUPS, TRACKS } from '@/lib/tracks';

/** Every ready-made track, by intention, as a two-column grid with filter chips. */
export function TrackGrid() {
  const { width } = useWindowDimensions();
  const [group, setGroup] = useState('all');
  // Two columns inside the screen's side padding, with a 12pt gap; capped for tablets and the web.
  const size = Math.floor((Math.min(width, 680) - 20 * 2 - 12) / 2);
  const groups = TRACK_GROUPS.filter((g) => group === 'all' || g.id === group);

  return (
    <>
      <ChipRow>
        <Chip label="All" selected={group === 'all'} onPress={() => setGroup('all')} />
        {TRACK_GROUPS.map((g) => (
          <Chip key={g.id} label={g.label} selected={group === g.id} onPress={() => setGroup(g.id)} />
        ))}
      </ChipRow>

      {groups.map((g) => (
        <Section key={g.id} label={g.label}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {g.tracks.map((id) => {
              const track = trackById(id)!;
              return (
                <ShelfCard
                  key={id}
                  icon={track.icon}
                  index={TRACKS.indexOf(track)}
                  title={track.title}
                  subtitle={`${track.lines.length} affirmations`}
                  size={size}
                  onPress={() => router.push({ pathname: '/track/[id]', params: { id } })}
                />
              );
            })}
          </View>
        </Section>
      ))}
    </>
  );
}

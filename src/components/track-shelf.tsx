import { Shelf, ShelfCard } from '@/components/art';
import { TRACKS, type Track } from '@/lib/tracks';

/** A sideways row of the ready-made tracks. */
export function TrackShelf({
  selectedId,
  onPick,
  first = [],
}: {
  selectedId?: string;
  onPick: (track: Track) => void;
  /** Track ids to put at the front (what they picked in onboarding). */
  first?: string[];
}) {
  const ordered = [...TRACKS].sort((a, b) => rank(first, a.id) - rank(first, b.id));
  return (
    <Shelf>
      {ordered.map((track) => (
        <ShelfCard
          key={track.id}
          icon={track.icon}
          index={TRACKS.indexOf(track)}
          title={track.title}
          subtitle={track.about}
          selected={track.id === selectedId}
          onPress={() => onPick(track)}
        />
      ))}
    </Shelf>
  );
}

const rank = (first: string[], id: string) => {
  const i = first.indexOf(id);
  return i === -1 ? first.length : i;
};

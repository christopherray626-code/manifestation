import { Shelf, ShelfCard } from '@/components/art';
import { TRACKS, type Track } from '@/lib/tracks';

/** A sideways row of the ready-made tracks. */
export function TrackShelf({ selectedId, onPick }: { selectedId?: string; onPick: (track: Track) => void }) {
  return (
    <Shelf>
      {TRACKS.map((track, i) => (
        <ShelfCard
          key={track.id}
          icon={track.icon}
          index={i}
          title={track.title}
          subtitle={track.about}
          selected={track.id === selectedId}
          onPress={() => onPick(track)}
        />
      ))}
    </Shelf>
  );
}

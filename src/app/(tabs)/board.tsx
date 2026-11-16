import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { JournalPanel, WHY_SCRIPTING } from '@/components/journal';
import { Button, Chip, ChipRow, Field, Icon, Screen, Txt, useTheme, WithInfo } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { tap } from '@/lib/haptics';
import { deletePhoto as deleteFile, savePhoto, usePhotoUris } from '@/lib/photos';
import { useStore } from '@/lib/store';
import { newId, type BoardPhoto } from '@/lib/types';

/**
 * The Board tab: the vision board (your own photos of what's already yours, as a board and as a
 * slideshow, no AI images) and the scripting journal, one tap apart.
 */
export default function BoardScreen() {
  const t = useTheme();
  // Links to the journal (Today's card, old /journal links) open this tab on it.
  const { show } = useLocalSearchParams<{ show?: string }>();
  const [view, setView] = useState<'board' | 'journal'>(show === 'journal' ? 'journal' : 'board');
  const [seenShow, setSeenShow] = useState(show);
  if (show !== seenShow) {
    setSeenShow(show);
    if (show === 'journal' || show === 'board') setView(show);
  }
  const { board, goals, addPhotos } = useStore();
  const uris = usePhotoUris(board.map((p) => p.file));
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function add() {
    setError('');
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 20,
      quality: 1,
    });
    if (picked.canceled || !picked.assets.length) return;
    setAdding(true);
    try {
      const made: BoardPhoto[] = [];
      for (const asset of picked.assets) {
        const id = newId();
        const file = await savePhoto(asset.uri, asset.width, id);
        made.push({ id, file, caption: '', createdAt: Date.now() });
      }
      addPhotos(made);
      tap();
    } catch {
      setError("Couldn't add that photo. Try a different one.");
    } finally {
      setAdding(false);
    }
  }

  const header = (
    <View style={{ gap: 14 }}>
      {view === 'journal' ? (
        <WithInfo info={WHY_SCRIPTING} about="scripting">
          <Txt variant="display">Journal</Txt>
        </WithInfo>
      ) : (
        <Txt variant="display">Vision board</Txt>
      )}
      <ChipRow>
        <Chip label="Vision board" selected={view === 'board'} onPress={() => setView('board')} />
        <Chip label="Journal" selected={view === 'journal'} onPress={() => setView('journal')} />
      </ChipRow>
    </View>
  );

  if (view === 'journal') {
    return (
      <Screen>
        {header}
        <JournalPanel />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

      {board.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 40 }}>
          <Icon name="images-outline" size={40} color={t.colors.accent} />
          <Txt variant="title" style={{ textAlign: 'center' }}>
            Picture it already here
          </Txt>
        </View>
      ) : (
        <>
          <Button title="Play slideshow" icon="play" onPress={() => router.push('/slideshow')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {board.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setEditing(p.id)}
                accessibilityRole="button"
                accessibilityLabel={p.caption || 'Photo'}
                style={{ width: '48.5%', aspectRatio: 3 / 4, borderRadius: t.radius, overflow: 'hidden', backgroundColor: t.colors.card }}>
                {uris[p.file] && <Image source={{ uri: uris[p.file] }} style={{ flex: 1 }} contentFit="cover" />}
                {!!(p.caption || goals.find((g) => g.id === p.goalId)) && (
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <Txt variant="muted" numberOfLines={2} style={{ color: '#fff' }}>
                      {p.caption || goals.find((g) => g.id === p.goalId)?.title}
                    </Txt>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Button title={adding ? 'Adding…' : 'Add photos'} icon="add" kind={board.length ? 'ghost' : 'primary'} onPress={adding ? () => {} : add} />
      {!!error && <Txt variant="muted">{error}</Txt>}

      <PhotoSheet id={editing} uri={editing ? uris[board.find((p) => p.id === editing)?.file ?? ''] : undefined} onClose={() => setEditing(null)} />
    </Screen>
  );
}

function PhotoSheet({ id, uri, onClose }: { id: string | null; uri?: string; onClose: () => void }) {
  const t = useTheme();
  const { board, goals, updatePhoto, deletePhoto, movePhoto } = useStore();
  const photo = board.find((p) => p.id === id);
  if (!photo) return null;
  const at = board.indexOf(photo);

  async function remove() {
    if (!(await confirm('Remove this photo?', 'It comes off your board. The original stays in your phone’s photos.'))) return;
    deletePhoto(photo!.id);
    deleteFile(photo!.file).catch(() => {});
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: t.colors.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '88%',
          borderTopWidth: 1,
          borderColor: t.colors.border,
        }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {uri && <Image source={{ uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: t.radius }} contentFit="cover" />}
          <Field
            value={photo.caption}
            placeholder="What this already is for you"
            onChangeText={(caption) => updatePhoto(photo.id, { caption })}
          />
          {goals.length > 0 && (
            <View style={{ gap: 8 }}>
              <WithInfo info="The slideshow shows today’s affirmation from that manifestation under the photo." about="Goes with">
                <Txt variant="label">Goes with</Txt>
              </WithInfo>
              <ChipRow>
                {goals.map((g) => (
                  <Chip
                    key={g.id}
                    label={g.title}
                    selected={photo.goalId === g.id}
                    onPress={() => updatePhoto(photo.id, { goalId: photo.goalId === g.id ? undefined : g.id })}
                  />
                ))}
              </ChipRow>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="Earlier" icon="arrow-back" kind="ghost" onPress={() => at > 0 && movePhoto(photo.id, -1)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Later" icon="arrow-forward" kind="ghost" onPress={() => at < board.length - 1 && movePhoto(photo.id, 1)} />
            </View>
          </View>
          <Button title="Done" onPress={onClose} />
          <Button title="Remove photo" icon="trash-outline" kind="ghost" onPress={remove} />
        </ScrollView>
      </View>
    </Modal>
  );
}

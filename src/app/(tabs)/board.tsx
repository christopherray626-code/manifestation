import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button, Chip, ChipRow, Field, Icon, Screen, Txt, useTheme } from '@/components/ui';
import { tap } from '@/lib/haptics';
import { deletePhoto as deleteFile, savePhoto, usePhotoUris } from '@/lib/photos';
import { useStore } from '@/lib/store';
import { newId, type BoardPhoto } from '@/lib/types';

/** Your own photos of what's already yours, as a board and as a slideshow. No AI images. */
export default function BoardScreen() {
  const t = useTheme();
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

  return (
    <Screen>
      <Txt variant="display">Vision board</Txt>

      {board.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 40 }}>
          <Icon name="images-outline" size={40} color={t.colors.accent} />
          <Txt variant="title" style={{ textAlign: 'center' }}>
            Picture it already here
          </Txt>
          <Txt variant="muted" style={{ textAlign: 'center', maxWidth: 300 }}>
            Add photos of the home, the trip, the life. Then play them as a slideshow.
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

  function remove() {
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
              <Txt variant="label">Goes with</Txt>
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
              <Txt variant="muted">The slideshow shows today&apos;s affirmation from it under the photo.</Txt>
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

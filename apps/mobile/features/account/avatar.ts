import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

import { accountKeys, toProfile } from './api';

const AVATAR_BUCKET = 'avatars';
// Big enough for the profile header on any phone, small enough to upload quickly.
const AVATAR_SIZE_PX = 512;
const AVATAR_JPEG_QUALITY = 0.8;

export function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Opens the system photo picker (no permission needed) with a square crop. */
export async function pickAvatar(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

async function toUploadableJpeg(uri: string): Promise<ArrayBuffer> {
  const image = await ImageManipulator.manipulate(uri)
    .resize({ width: AVATAR_SIZE_PX })
    .renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: AVATAR_JPEG_QUALITY });
  const response = await fetch(saved.uri);
  return response.arrayBuffer();
}

interface UploadAvatarInput {
  uri: string;
  previousPath: string | null;
}

export function useUploadAvatar(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri, previousPath }: UploadAvatarInput) => {
      const avatars = supabase.storage.from(AVATAR_BUCKET);
      // A new file name each time, so phones never show a cached old photo.
      const path = `${userId}/${String(Date.now())}.jpg`;

      const { error: uploadError } = await avatars.upload(path, await toUploadableJpeg(uri), {
        contentType: 'image/jpeg',
      });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_path: path })
        .eq('id', userId)
        .select('*')
        .single();
      if (error) {
        await avatars.remove([path]);
        throw error;
      }

      if (previousPath) {
        // Best effort: an orphaned old photo is harmless and is removed with the account.
        await avatars.remove([previousPath]);
      }
      return toProfile(data);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(accountKeys.profile(userId), profile);
    },
  });
}

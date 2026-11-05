import { router } from 'expo-router';

/** Someone's profile; your own is the Perfil tab. */
export function openUser(userId: string, viewer: string) {
  if (userId === viewer) router.navigate('/profile');
  else router.push({ pathname: '/users/[id]', params: { id: userId } });
}

/** A workout's page. `owner` tells it to read someone else's shared workout. */
export function openWorkout(workoutId: string, ownerId: string, viewer: string) {
  router.push({
    pathname: '/workouts/[id]',
    params: ownerId === viewer ? { id: workoutId } : { id: workoutId, owner: ownerId },
  });
}

export function openComments(workoutId: string) {
  router.push({ pathname: '/comments/[workoutId]', params: { workoutId } });
}

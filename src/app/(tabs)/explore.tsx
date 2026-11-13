import { Redirect } from 'expo-router';

/** Explore was folded into the Manifest tab; old links land there. */
export default function ExploreScreen() {
  return <Redirect href="/create" />;
}

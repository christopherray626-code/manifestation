import { Redirect } from 'expo-router';

/** The journal moved onto the Board tab; old links (and reminders) land there. */
export default function JournalLink() {
  return <Redirect href={{ pathname: '/board', params: { show: 'journal' } }} />;
}

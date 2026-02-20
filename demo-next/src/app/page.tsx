import { redirect } from 'next/navigation';

/**
 * Root Page - Redirects to Main Voting
 */
export default function Home() {
  redirect('/main');
}

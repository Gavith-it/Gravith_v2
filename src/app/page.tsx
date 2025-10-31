import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to home page by default
  redirect('/home');
}

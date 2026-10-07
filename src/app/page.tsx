import { redirect } from 'next/navigation';

// Root redirect — authenticated users land on dashboard
export default function RootPage() {
  redirect('/dashboard');
}

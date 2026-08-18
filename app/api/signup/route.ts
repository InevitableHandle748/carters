export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Self-registration is disabled. Users are created by Admins only.
export async function POST() {
  return NextResponse.json(
    { error: 'Self-registration is disabled. Please contact your administrator to create an account.' },
    { status: 403 }
  );
}

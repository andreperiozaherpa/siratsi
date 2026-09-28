import { NextResponse } from 'next/server';
import { revokeSession } from '../../../password-auth';

export async function GET(request: Request) {
  await revokeSession();
  return NextResponse.redirect(new URL('/', request.url));
}

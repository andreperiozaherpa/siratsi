import { NextResponse } from 'next/server';
import { getChatGPTUser, chatGPTSignOutPath } from '../../../chatgpt-auth';
import { revokeSession } from '../../../password-auth';

export async function GET(request: Request) {
  const chatUser = await getChatGPTUser();
  await revokeSession();
  return NextResponse.redirect(new URL(chatUser ? chatGPTSignOutPath('/') : '/', request.url));
}

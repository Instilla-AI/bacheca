import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role } = body as { email: string; name?: string; role?: 'ADMIN'|'USER' };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e: unknown) {
    const message = typeof e === 'object' && e && 'message' in e ? String((e as any).message) : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

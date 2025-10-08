import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { email, name, role } = body as { email?: string; name?: string | null; role?: 'ADMIN'|'USER' };

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(email ? { email } : {}),
        ...(typeof name !== 'undefined' ? { name } : {}),
        ...(role ? { role } : {}),
      },
    });
    return NextResponse.json({ user });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e && 'message' in e ? String((e as any).message) : 'Failed to update user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

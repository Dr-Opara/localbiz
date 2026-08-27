import { NextResponse } from 'next/server';
import { LOCALBIZ_CATEGORIES } from '@/lib/categories';

export async function GET() {
  return NextResponse.json({ categories: LOCALBIZ_CATEGORIES });
}

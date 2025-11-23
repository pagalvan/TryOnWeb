import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
      throw error;
    }

    return NextResponse.json({ measurements: data });
  } catch (error: any) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const body = await req.json();
    const { altura_cm, peso_kg, pecho_cm, cintura_cm, cadera_cm, complexion } = body;

    // Validate input (basic)
    if (!altura_cm || !peso_kg) {
      return NextResponse.json({ error: 'Altura y peso son requeridos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        profile_id: user.id,
        altura_cm,
        peso_kg,
        pecho_cm,
        cintura_cm,
        cadera_cm,
        complexion,
        updated_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ measurements: data });
  } catch (error: any) {
    console.error('Error saving measurements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

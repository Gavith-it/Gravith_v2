import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    // For now, we'll use localStorage on the client side
    // In the future, you can create a user_preferences table
    // This endpoint can return default preferences
    return NextResponse.json({
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        darkMode: false,
        language: 'en',
        timezone: 'Asia/Kolkata',
      },
    });
  } catch (error) {
    console.error('Unexpected error fetching preferences:', error);
    return NextResponse.json({ error: 'Unexpected error fetching preferences' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    const body = (await request.json()) as {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      darkMode?: boolean;
      language?: string;
      timezone?: string;
    };

    // For now, preferences are stored in localStorage on the client side
    // In the future, you can create a user_preferences table and store here
    // This endpoint can acknowledge the update
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: body,
    });
  } catch (error) {
    console.error('Unexpected error updating preferences:', error);
    return NextResponse.json({ error: 'Unexpected error updating preferences' }, { status: 500 });
  }
}


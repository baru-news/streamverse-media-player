import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const handler = async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase Admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Verify the user is authenticated and is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({
        error: 'Forbidden: Admin access required'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // --- Perbaikan Utama di Sini ---
    const { action, email, redirect_to_origin } = await req.json();
    // --- Perbaikan Selesai ---

    switch(action){
      case 'reset_password':
        // Buat URL pengalihan yang dinamis dengan fallback
        const finalRedirectUrl = redirect_to_origin || Deno.env.get('SUPABASE_URL');
        
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${finalRedirectUrl}/reset-password`
        });

        if (resetError) {
          console.error('Password reset error:', resetError);
          return new Response(JSON.stringify({
            error: 'Failed to send password reset email',
            details: resetError.message
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        console.log(`Admin ${user.email} initiated password reset for user ${email}`);
        return new Response(JSON.stringify({
          success: true,
          message: 'Password reset email sent successfully'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
    }
  } catch (error) {
    console.error('Error in admin-user-management function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

serve(handler);
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssignAdminRequest {
  userId: string;
  action: 'assign' | 'remove';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if the current user is already an admin
    const { data: currentUserRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    const requestBody: AssignAdminRequest = await req.json();
    const { userId, action } = requestBody;

    // Special case: If there are no admins in the system, allow the first user to become admin
    const { data: existingAdmins, error: adminCheckError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'admin');

    if (adminCheckError) {
      console.error('Error checking for existing admins:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const isFirstAdmin = !existingAdmins || existingAdmins.length === 0;
    
    // Allow assignment if user is admin OR if this is the first admin being created
    if (!currentUserRole && !isFirstAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins can assign roles' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'assign') {
      // Assign admin role
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: 'admin' 
        }, {
          onConflict: 'user_id,role'
        });

      if (error) {
        console.error('Error assigning admin role:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to assign admin role' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin role assigned successfully',
          isFirstAdmin 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else if (action === 'remove') {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        console.error('Error removing admin role:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to remove admin role' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin role removed successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "assign" or "remove"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in assign-admin function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
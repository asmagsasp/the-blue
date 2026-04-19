const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://kggukwkireimgexsezek.supabase.co';
const supabaseKey = 'sb_publishable_d9lFOKzv88k2Hv9roRdvZQ_X7K9xKAq';
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipe() {
    console.log("Attempting to delete all transactions...");
    const { data: tData, error: tErr } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Trans:", tData, tErr ? tErr.message : "Success");

    console.log("Attempting to delete all users...");
    const { data: uData, error: uErr } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Users:", uData, uErr ? uErr.message : "Success");
}
wipe();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmoywzkmvawjfsnwcniv.supabase.co';
const supabaseKey = 'sb_publishable_ovnXlc61OGVIXHsIiWfk0w_CLOKvvMN';

export const supabase = createClient(supabaseUrl, supabaseKey);
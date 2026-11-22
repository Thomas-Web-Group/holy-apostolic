-- Owner-only: run in Supabase's trusted SQL editor; export results as CSV there.
-- Never expose this query as a public view, browser API, or user-callable function.
-- Re-run immediately before a future mailing to honor changed preferences/deletions.
select p.email_at_consent as email, p.consented_at, p.consent_version, p.consent_text
from public.email_preferences p
join auth.users u on u.id=p.user_id
where p.subscribed=true
  and u.email_confirmed_at is not null
  and lower(p.email_at_consent)=lower(u.email)
order by p.consented_at;

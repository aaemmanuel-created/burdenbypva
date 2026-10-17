// POST /paystack-webhook — signed event from paystack. Verifies the signature, then
// moves the gift's timeline forward.

import { handleWebhook } from '../_shared/webhook.ts';

Deno.serve((req) => handleWebhook('paystack', req));

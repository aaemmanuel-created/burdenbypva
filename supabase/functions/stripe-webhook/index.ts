// POST /stripe-webhook — signed event from stripe. Verifies the signature, then
// moves the gift's timeline forward.

import { handleWebhook } from '../_shared/webhook.ts';

Deno.serve((req) => handleWebhook('stripe', req));

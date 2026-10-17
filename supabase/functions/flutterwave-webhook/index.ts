// POST /flutterwave-webhook — signed event from flutterwave. Verifies the signature, then
// moves the gift's timeline forward.

import { handleWebhook } from '../_shared/webhook.ts';

Deno.serve((req) => handleWebhook('flutterwave', req));

fetch.ts:15 GET https://yrknpwyindvfevhkionn.supabase.co/rest/v1/customers?select=customer_id&customer_id=eq.JCW0N 406 (Not Acceptable)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
await in (anonymous)
then @ PostgrestBuilder.ts:114
fetch.ts:15 POST https://yrknpwyindvfevhkionn.supabase.co/rest/v1/customers?select=* 400 (Bad Request)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
await in (anonymous)
then @ PostgrestBuilder.ts:114
client-error-handler.ts:30 Client error: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'customer_marking' column of 'customers' in the schema cache"}
error @ intercept-console-error.ts:44
handleClientError @ client-error-handler.ts:30
createCustomer @ client-services.ts:46
await in createCustomer
processOrderCompletion @ DropPointPayment.tsx:209
await in processOrderCompletion
handleConfirmPayment @ DropPointPayment.tsx:173
executeDispatch @ react-dom-client.development.js:16921
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:16971
(anonymous) @ react-dom-client.development.js:17572
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17125
dispatchEvent @ react-dom-client.development.js:21308
dispatchDiscreteEvent @ react-dom-client.development.js:21276
fetch.ts:15 POST https://yrknpwyindvfevhkionn.supabase.co/rest/v1/services?columns=%22invoice_id%22%2C%22customer_id%22%2C%22customer_name%22%2C%22customer_whatsapp%22%2C%22customer_marking%22%2C%22shoe_name%22%2C%22service%22%2C%22amount%22%2C%22color%22%2C%22size%22%2C%22item_number%22%2C%22drop_point_id%22%2C%22fulfillment_type%22%2C%22total_price%22%2C%22payment_method%22%2C%22payment_status%22%2C%22status%22%2C%22has_white_treatment%22%2C%22created_at%22 404 (Not Found)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
await in (anonymous)
then @ PostgrestBuilder.ts:114
DropPointPayment.tsx:267 Error processing order: {code: 'PGRST205', details: null, hint: "Perhaps you meant the table 'public.add_on_services'", message: "Could not find the table 'public.services' in the schema cache"}
error @ intercept-console-error.ts:44
processOrderCompletion @ DropPointPayment.tsx:267
await in processOrderCompletion
handleConfirmPayment @ DropPointPayment.tsx:173
executeDispatch @ react-dom-client.development.js:16921
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:16971
(anonymous) @ react-dom-client.development.js:17572
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17125
dispatchEvent @ react-dom-client.development.js:21308
dispatchDiscreteEvent @ react-dom-client.development.js:21276

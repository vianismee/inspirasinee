fetch.ts:15 GET https://yrknpwyindvfevhkionn.supabase.co/rest/v1/customers?select=customer_id&customer_id=eq.Q60MN 406 (Not Acceptable)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
push.[project]/node_modules/@supabase/supabase-js/dist/module/lib/fetch.js [app-client] (ecmascript).**awaiter @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:115
fetch.ts:15 GET https://yrknpwyindvfevhkionn.supabase.co/rest/v1/drop_point_customer_markers?select=id%2Ctotal_orders%2Ctotal_items&customer_id=eq.Q60MN&drop_point_id=eq.1 406 (Not Acceptable)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
push.[project]/node_modules/@supabase/supabase-js/dist/module/lib/fetch.js [app-client] (ecmascript).**awaiter @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:115
fetch.ts:15 PATCH https://yrknpwyindvfevhkionn.supabase.co/rest/v1/orders?invoice_id=eq.QAYZJH4&fulfillment_type=eq.drop-point&select=* 400 (Bad Request)
(anonymous) @ fetch.ts:15
(anonymous) @ fetch.ts:46
fulfilled @ fetch.ts:2
Promise.then
step @ fetch.ts:2
(anonymous) @ fetch.ts:2
push.[project]/node_modules/@supabase/supabase-js/dist/module/lib/fetch.js [app-client] (ecmascript).\_\_awaiter @ fetch.ts:2
(anonymous) @ fetch.ts:34
then @ PostgrestBuilder.ts:115
client-error-handler.ts:30 Client error: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'updated_at' column of 'orders' in the schema cache"}
error @ intercept-console-error.ts:44
handleClientError @ client-error-handler.ts:30
updatePaymentStatus @ client-services.ts:2079
await in updatePaymentStatus
processOrderCompletion @ DropPointPayment.tsx:206
await in processOrderCompletion
handleConfirmPayment @ DropPointPayment.tsx:154
executeDispatch @ react-dom-client.development.js:16921
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:16971
(anonymous) @ react-dom-client.development.js:17572
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17125
dispatchEvent @ react-dom-client.development.js:21308
dispatchDiscreteEvent @ react-dom-client.development.js:21276
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:345
Button @ button.tsx:51
react_stack_bottom_frame @ react-dom-client.development.js:23552
renderWithHooksAgain @ react-dom-client.development.js:6863
renderWithHooks @ react-dom-client.development.js:6775
updateFunctionComponent @ react-dom-client.development.js:9069
beginWork @ react-dom-client.development.js:10679
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15677
workLoopSync @ react-dom-client.development.js:15497
renderRootSync @ react-dom-client.development.js:15477
performWorkOnRoot @ react-dom-client.development.js:14941
performSyncWorkOnRoot @ react-dom-client.development.js:16781
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16627
processRootScheduleInMicrotask @ react-dom-client.development.js:16665
(anonymous) @ react-dom-client.development.js:16800
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:345
DropPointPayment @ DropPointPayment.tsx:334
react_stack_bottom_frame @ react-dom-client.development.js:23552
renderWithHooksAgain @ react-dom-client.development.js:6863
renderWithHooks @ react-dom-client.development.js:6775
updateFunctionComponent @ react-dom-client.development.js:9069
beginWork @ react-dom-client.development.js:10679
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15677
workLoopSync @ react-dom-client.development.js:15497
renderRootSync @ react-dom-client.development.js:15477
performWorkOnRoot @ react-dom-client.development.js:14941
performSyncWorkOnRoot @ react-dom-client.development.js:16781
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16627
processRootScheduleInMicrotask @ react-dom-client.development.js:16665
(anonymous) @ react-dom-client.development.js:16800

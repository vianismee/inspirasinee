| tablename           | policyname                               | permissive | roles    | command |
| ------------------- | ---------------------------------------- | ---------- | -------- | ------- |
| customers           | Admins can view all customers            | PERMISSIVE | {public} | ALL     |
| customers           | Customers - Public Read Access           | PERMISSIVE | {public} | SELECT  |
| customers           | Policy with security definer functions   | PERMISSIVE | {public} | ALL     |
| customers           | Users can view their own customer data   | PERMISSIVE | {public} | SELECT  |
| order_item          | Admins can manage all order items        | PERMISSIVE | {public} | ALL     |
| order_item          | Order Item - Public Read Access          | PERMISSIVE | {public} | SELECT  |
| order_item          | Policy with security definer functions   | PERMISSIVE | {public} | ALL     |
| order_item          | Users can view their order items         | PERMISSIVE | {public} | SELECT  |
| orders              | Admins can manage all orders             | PERMISSIVE | {public} | ALL     |
| orders              | Orders - Public Read Access              | PERMISSIVE | {public} | SELECT  |
| orders              | Policy with security definer functions   | PERMISSIVE | {public} | ALL     |
| orders              | Users can view their orders              | PERMISSIVE | {public} | SELECT  |
| points_transactions | Admins can manage all transactions       | PERMISSIVE | {public} | ALL     |
| points_transactions | Points Transactions - Public Read Access | PERMISSIVE | {public} | SELECT  |
| points_transactions | Policy with security definer functions   | PERMISSIVE | {public} | ALL     |
| points_transactions | Users can view their points transactions | PERMISSIVE | {public} | SELECT  |
| referral_usage      | Admins can manage all referrals          | PERMISSIVE | {public} | ALL     |
| referral_usage      | Policy with security definer functions   | PERMISSIVE | {public} | ALL     |
| referral_usage      | Referral Usage - Public Read Access      | PERMISSIVE | {public} | SELECT  |
| referral_usage      | Users can view their referral usage      | PERMISSIVE | {public} | SELECT  |

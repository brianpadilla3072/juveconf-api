-- Script para insertar emails de entrada (TICKET_DOWNLOAD) faltantes
-- Generado: 2025-10-29
-- Total: 12 emails para 12 pagos aprobados

INSERT INTO "EmailQueue" (
  "id",
  "to",
  "subject",
  "template",
  "context",
  "emailType",
  "orderId",
  "paymentId",
  "status",
  "attempts",
  "createdAt",
  "updatedAt"
) VALUES

-- 1. marcofquevedo@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000001',
  'marcofquevedo@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"marcofquevedo","paymentId":"d7fd545c-79e3-4813-94b5-6be5a316ed6c","ticketUrl":"https://www.juveconfe.com/ticket/d7fd545c-79e3-4813-94b5-6be5a316ed6c"}',
  'TICKET_DOWNLOAD',
  'a38f9023-bd16-42f4-a488-0d244c98faa5',
  'd7fd545c-79e3-4813-94b5-6be5a316ed6c',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 2. avitalejandra96@gmail.com (Pago 1)
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000002',
  'avitalejandra96@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"avitalejandra96","paymentId":"beb9892d-a196-45b3-a3f0-ca0f67a333da","ticketUrl":"https://www.juveconfe.com/ticket/beb9892d-a196-45b3-a3f0-ca0f67a333da"}',
  'TICKET_DOWNLOAD',
  'd84e120f-62a1-4274-8ebe-005800f7c99b',
  'beb9892d-a196-45b3-a3f0-ca0f67a333da',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 3. prmangold@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000003',
  'prmangold@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"prmangold","paymentId":"882b968d-6611-44ef-bb5b-6d636f992827","ticketUrl":"https://www.juveconfe.com/ticket/882b968d-6611-44ef-bb5b-6d636f992827"}',
  'TICKET_DOWNLOAD',
  '5f33df87-bf90-4fae-8f9e-c9ef8141a0bc',
  '882b968d-6611-44ef-bb5b-6d636f992827',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 4. avitalejandra96@gmail.com (Pago 2)
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000004',
  'avitalejandra96@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"avitalejandra96","paymentId":"99e37fe0-168f-4e11-9dfc-e738083be637","ticketUrl":"https://www.juveconfe.com/ticket/99e37fe0-168f-4e11-9dfc-e738083be637"}',
  'TICKET_DOWNLOAD',
  '80000180-7d2c-47e5-a3d3-8b712bcaa0cd',
  '99e37fe0-168f-4e11-9dfc-e738083be637',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 5. virilafalla91@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000005',
  'virilafalla91@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"virilafalla91","paymentId":"82e00412-0b73-46cb-9268-7039004f58de","ticketUrl":"https://www.juveconfe.com/ticket/82e00412-0b73-46cb-9268-7039004f58de"}',
  'TICKET_DOWNLOAD',
  '6cfb9f1a-827f-4a9b-922a-9370717282b5',
  '82e00412-0b73-46cb-9268-7039004f58de',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 6. magalijaquee@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000006',
  'magalijaquee@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"magalijaquee","paymentId":"8c149ff0-fcd1-486a-b6cd-c2e41490b5c0","ticketUrl":"https://www.juveconfe.com/ticket/8c149ff0-fcd1-486a-b6cd-c2e41490b5c0"}',
  'TICKET_DOWNLOAD',
  '823e71ae-ff0f-49b6-8861-51341c710ff1',
  '8c149ff0-fcd1-486a-b6cd-c2e41490b5c0',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 7. jaquemarianella@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000007',
  'jaquemarianella@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"jaquemarianella","paymentId":"30dffe60-6843-403b-86b8-d66e8bbf23ca","ticketUrl":"https://www.juveconfe.com/ticket/30dffe60-6843-403b-86b8-d66e8bbf23ca"}',
  'TICKET_DOWNLOAD',
  'a9d4f41f-79bc-4cfa-9da9-2f694dcb86ac',
  '30dffe60-6843-403b-86b8-d66e8bbf23ca',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 8. cristinaferullo@gmail.com (Pago 1)
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000008',
  'cristinaferullo@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"cristinaferullo","paymentId":"1748ff18-7473-4cab-b22a-1647ef52f6b4","ticketUrl":"https://www.juveconfe.com/ticket/1748ff18-7473-4cab-b22a-1647ef52f6b4"}',
  'TICKET_DOWNLOAD',
  '43fee786-0225-4759-aab7-880e8918c070',
  '1748ff18-7473-4cab-b22a-1647ef52f6b4',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 9. cristinaferullo@gmail.com (Pago 2)
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000009',
  'cristinaferullo@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"cristinaferullo","paymentId":"a226f3e4-b04e-426f-b071-ce63fedbe339","ticketUrl":"https://www.juveconfe.com/ticket/a226f3e4-b04e-426f-b071-ce63fedbe339"}',
  'TICKET_DOWNLOAD',
  '50e8fd69-1751-47a2-b484-28d59510840c',
  'a226f3e4-b04e-426f-b071-ce63fedbe339',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 10. maxiperalta2015@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000010',
  'maxiperalta2015@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"maxiperalta2015","paymentId":"3040acae-888c-4e41-be65-4a5e62c9165c","ticketUrl":"https://www.juveconfe.com/ticket/3040acae-888c-4e41-be65-4a5e62c9165c"}',
  'TICKET_DOWNLOAD',
  'e61c9390-993e-403c-9c27-68e8e8c95a6f',
  '3040acae-888c-4e41-be65-4a5e62c9165c',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 11. soficarp09@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000011',
  'soficarp09@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"soficarp09","paymentId":"2dbe4081-13c7-488e-b304-d6475ec7d8fb","ticketUrl":"https://www.juveconfe.com/ticket/2dbe4081-13c7-488e-b304-d6475ec7d8fb"}',
  'TICKET_DOWNLOAD',
  '9cea83ff-5124-45e3-9378-017df095207a',
  '2dbe4081-13c7-488e-b304-d6475ec7d8fb',
  'PENDING',
  0,
  NOW(),
  NOW()
),

-- 12. rsebapon@gmail.com
(
  'e1a2b3c4-d5e6-4f7a-8b9c-000000000012',
  'rsebapon@gmail.com',
  'Tu entrada - JUVECONF 2025',
  'ticket-details',
  '{"userName":"rsebapon","paymentId":"65d8b581-16e4-4b06-99f7-ffc740f2cb5c","ticketUrl":"https://www.juveconfe.com/ticket/65d8b581-16e4-4b06-99f7-ffc740f2cb5c"}',
  'TICKET_DOWNLOAD',
  '62065111-8561-4902-b0f7-91d829a396cf',
  '65d8b581-16e4-4b06-99f7-ffc740f2cb5c',
  'PENDING',
  0,
  NOW(),
  NOW()
);

-- Verificar los inserts
SELECT COUNT(*) as total_inserted FROM "EmailQueue" WHERE "emailType" = 'TICKET_DOWNLOAD';

CREATE TABLE public.message_templates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT message_templates_pkey PRIMARY KEY (id)
);

-- Insert the default invoice WhatsApp template
INSERT INTO public.message_templates (name, content)
VALUES (
  'invoice_whatsapp',
  'Halo kak [customer], berikut invoice order [code].\n\n[item]\n\nBerikut link tracking order Anda: [link]\nTerimakasih atas kepercayaannya.'
);

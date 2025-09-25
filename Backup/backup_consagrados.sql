--
-- PostgreSQL database dump
--

\restrict U426GbmLvZqOMQCHnX7iflOlPhmiiU5g6zxUcfcSmGG8S5vyiogufD9nCWac5pI

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: AuthProvider; Type: TYPE; Schema: public; Owner: brian
--

CREATE TYPE public."AuthProvider" AS ENUM (
    'LOCAL',
    'AUTH0'
);


ALTER TYPE public."AuthProvider" OWNER TO brian;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: brian
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'REVIEW',
    'PAID'
);


ALTER TYPE public."OrderStatus" OWNER TO brian;

--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: brian
--

CREATE TYPE public."PaymentType" AS ENUM (
    'TRANSFER',
    'MERCADOPAGO',
    'CASH'
);


ALTER TYPE public."PaymentType" OWNER TO brian;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: brian
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPERADMIN',
    'DEVELOPER',
    'ADMIN',
    'EDITOR',
    'COLLABORATOR',
    'USER'
);


ALTER TYPE public."UserRole" OWNER TO brian;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Combo; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."Combo" (
    id text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    year integer NOT NULL,
    "minPersons" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "eventId" text NOT NULL
);


ALTER TABLE public."Combo" OWNER TO brian;

--
-- Name: Egreso; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."Egreso" (
    id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    concepto text NOT NULL,
    monto double precision NOT NULL,
    "metodoPago" text NOT NULL,
    notas text,
    year integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Egreso" OWNER TO brian;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    year integer NOT NULL,
    topic text NOT NULL,
    capacity integer NOT NULL,
    "salesStartDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Event" OWNER TO brian;

--
-- Name: Ingreso; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."Ingreso" (
    id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    concepto text NOT NULL,
    monto double precision NOT NULL,
    "metodoPago" text NOT NULL,
    notas text,
    year integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Ingreso" OWNER TO brian;

--
-- Name: Invitee; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."Invitee" (
    id text NOT NULL,
    name text NOT NULL,
    cuil text NOT NULL,
    "orderId" text,
    "paymentId" text,
    "attendedDay1" boolean DEFAULT false NOT NULL,
    "attendedDay2" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    email text,
    phone text
);


ALTER TABLE public."Invitee" OWNER TO brian;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    year integer NOT NULL,
    "userId" text,
    "eventId" text NOT NULL,
    total double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentType" public."PaymentType" NOT NULL,
    "externalReference" text,
    "metadataToken" text,
    "preferenceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    cuil text NOT NULL,
    email text NOT NULL,
    phone text
);


ALTER TABLE public."Order" OWNER TO brian;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    year integer NOT NULL,
    "orderId" text NOT NULL,
    amount double precision NOT NULL,
    type public."PaymentType" NOT NULL,
    "externalReference" text,
    "userId" text,
    "payerName" text,
    "payerEmail" text,
    "payerDni" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "payerPhone" text
);


ALTER TABLE public."Payment" OWNER TO brian;

--
-- Name: PreSale; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."PreSale" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "discountPercent" double precision NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "ticketQuantity" integer NOT NULL,
    year integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."PreSale" OWNER TO brian;

--
-- Name: User; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "auth0Id" text,
    provider public."AuthProvider" DEFAULT 'LOCAL'::public."AuthProvider" NOT NULL,
    dni text NOT NULL,
    name text NOT NULL,
    "givenName" text,
    "familyName" text,
    nickname text,
    email text NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    picture text,
    locale text,
    password text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO brian;

--
-- Name: _ComboToOrder; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public."_ComboToOrder" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_ComboToOrder" OWNER TO brian;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: brian
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO brian;

--
-- Data for Name: Combo; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."Combo" (id, name, price, year, "minPersons", "createdAt", "updatedAt", "deletedAt", "eventId") FROM stdin;
062574a1-d300-4c43-be15-91d47295ffbd	Individual	18000	2025	1	2025-07-01 04:50:39.944	2025-07-01 04:50:39.944	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076
cf12f358-ab3d-44e4-812c-7948febf2876	3 Entradas	50000	2025	3	2025-07-01 04:50:40.138	2025-07-01 04:50:40.138	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076
a8ab4d13-2af9-4a93-b990-1a18e8580e4f	4 Entradas	65000	2025	4	2025-07-01 04:50:40.241	2025-07-01 04:50:40.241	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076
462394e3-79fc-4f4b-be68-043f4d1a6a82	5 Entradas	82000	2025	5	2025-07-01 04:50:40.379	2025-07-01 04:50:40.379	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076
0379d7cb-811b-41d8-8969-b08655467931	6 Entradas + 1 Gratis	108000	2025	7	2025-07-01 04:50:40.471	2025-07-01 04:50:40.471	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076
\.


--
-- Data for Name: Egreso; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."Egreso" (id, fecha, concepto, monto, "metodoPago", notas, year, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."Event" (id, year, topic, capacity, "salesStartDate", "createdAt", "updatedAt", "deletedAt") FROM stdin;
2999d126-3ae3-4f6a-b074-8ea7a0b14076	2025	Congreso Consagrados a Jesús 2025	200	2025-07-01 04:50:39.826	2025-07-01 04:50:39.832	2025-07-01 04:50:39.832	\N
\.


--
-- Data for Name: Ingreso; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."Ingreso" (id, fecha, concepto, monto, "metodoPago", notas, year, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Invitee; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."Invitee" (id, name, cuil, "orderId", "paymentId", "attendedDay1", "attendedDay2", "createdAt", "updatedAt", "deletedAt", email, phone) FROM stdin;
f28c1782-b10c-4251-af03-6fb15e58d46f	Maria de los angeles bellegia	31994400	775c12e9-1bad-4a36-908d-1479e7c36f79	ea903f2f-dfb4-4752-9dc8-97a105f364e3	f	f	2025-08-14 02:20:37.089	2025-08-14 02:20:37.089	\N	\N	\N
87615a1d-29d9-43a0-802f-99792b630748	Araceli Rivera	46561369	7e82d91a-b880-4f0e-bd85-b52d498d7ff8	e7e8012d-0f86-483d-a4ba-d7b8d79b8529	t	f	2025-08-14 02:20:04.924	2025-09-19 18:22:30.593	\N	\N	2915263326
1b26e4ab-860d-4267-8f53-32cd20cf83a1	mia aimee veisaga huenupi	27507857312	269f53f3-2c24-4e9a-88ce-546c7105ec58	7e2fa770-93be-48c4-a8d4-ed4be9891c57	f	f	2025-08-25 13:36:26.15	2025-08-25 13:36:26.15	\N	\N	\N
6168b2c2-5189-4175-9038-d087b42f4e48	Anahi Jazmin Arza	52723072	269f53f3-2c24-4e9a-88ce-546c7105ec58	7e2fa770-93be-48c4-a8d4-ed4be9891c57	t	f	2025-08-25 13:36:26.15	2025-09-19 21:16:20.686	\N	\N	2914438557
0ca0e0d8-dc20-4690-b302-004ae48ca362	Juliana Reisser	27533009803	125d1f65-8371-4384-940e-2ebee2ddbca8	b2dddc0f-f9a1-4b1a-80eb-c89428fc8ac6	t	f	2025-09-03 15:53:22.904	2025-09-19 18:19:40.426	\N	\N	\N
e0ebbb3c-4a11-4f97-8825-81056b72c7a9	Maribel Arellano	27436701603	ab71bba6-d187-4992-88a1-3eea683bceb5	809fcfed-2e80-4116-9fe3-31dc3625101e	t	f	2025-09-03 10:36:27.183	2025-09-19 22:34:28.637	\N	maribelarellanouni@gmail.com	2914614760
457da454-08dd-4daa-baad-04c4fc9edf74	Romina Rosales	20431858717	01db1715-d4e4-4803-86aa-c29a8c7beafb	13ddbf25-a18d-4f46-97a2-79e85c660d51	t	f	2025-09-04 00:10:39.392	2025-09-19 22:35:22.409	\N	rominarosales542@gmail.com	2914141494
7df20cc5-cc96-4ae4-9304-ff516a549669	Lara Angel	42810177	9a955561-c2e6-45da-850e-bfdb5abb4ec8	c8d8784f-c746-46d6-902d-9987c981c848	t	f	2025-08-14 02:20:12.423	2025-09-19 18:21:44.856	\N	\N	2920483396
40d384cb-f48b-4487-9a51-49ae8f8c13a0	milo bautista merloz beldrio	20532906831	269f53f3-2c24-4e9a-88ce-546c7105ec58	7e2fa770-93be-48c4-a8d4-ed4be9891c57	t	f	2025-08-25 13:36:26.15	2025-09-19 21:17:05.48	\N	\N	\N
81630428-f083-4890-8e24-c70493d56609	Cristian miguel busquet	40944237	d37094c0-8e12-48df-8635-e794b75a1ab5	bf1122bc-ba28-4257-a2fe-dc320efaad97	f	f	2025-08-14 02:20:49.443	2025-09-05 02:50:14.915	2025-09-05 02:50:14.914	\N	\N
58563ee4-7ff4-4b2a-b4e1-beace1969121	Abigail debora Troschasky	45314400	2690b815-8432-40b1-a938-c05907b9b482	064b3ed6-176e-4d2e-80f6-f67db9270c75	t	f	2025-09-08 12:01:08.177	2025-09-19 18:13:17.875	\N	\N	2914447668
604034b4-4ac1-4b67-bcb5-3460f483d237	bruno tomas merloz	20526131259	269f53f3-2c24-4e9a-88ce-546c7105ec58	7e2fa770-93be-48c4-a8d4-ed4be9891c57	t	f	2025-08-25 13:36:26.15	2025-09-19 21:17:20.591	\N	\N	\N
9dc20f86-d4d2-48d4-829b-71f5a57a6cc7	Rocío Soto Guerrero 	32528108	a3c9e3d0-29e6-4ff6-8d33-12d6a7bac0d3	6bda8834-0886-4abf-a0d4-c35d10e01d25	f	f	2025-08-12 03:21:19.307	2025-09-09 18:00:30.651	\N	\N	\N
03a03944-8d7d-4a45-bc3a-0d841be48ccf	Priscila Budareto	46154272	4397a7fe-fee9-4ff7-a52c-40c08cb75dd6	4bb68a64-028e-492b-8098-aa8417a0f010	t	f	2025-08-14 02:20:43.14	2025-09-19 15:39:31.614	\N	\N	\N
80809d0a-a8a3-4512-9ded-dc5ed44705db	Nicolas Eliseo Jonatán Vasquez	48994490	e5efab34-9e4e-4209-8452-220d45fa555c	deb402a7-de9f-444d-b52b-7c8c3a58008c	t	f	2025-09-02 14:15:38.599	2025-09-19 15:58:08.138	\N	\N	\N
56c62b68-ff44-41fa-88c0-c17f136c9bce	Berenice Reisser	27499182657	125d1f65-8371-4384-940e-2ebee2ddbca8	b2dddc0f-f9a1-4b1a-80eb-c89428fc8ac6	t	f	2025-09-03 15:53:22.904	2025-09-19 18:19:24.782	\N	\N	2914270921
c89920bd-2213-497c-8790-1cc8c893d456	daniela Paredes	42836442	8a246caf-9ec7-4bb0-a474-2f12fa31864d	e74499a0-35e5-45e5-a260-dd13947da340	t	f	2025-09-05 01:49:07.83	2025-09-19 15:44:04.121	\N	\N	2915119962
e1d2990f-99ed-49e0-9308-50cb95de0842	Rocio Antonella Farfal	42195343	e0685444-0a84-46b8-9498-2cd34ccdb19e	d720e6f4-79f3-4b3c-a947-e5b93f572b84	t	f	2025-08-19 12:40:24.978	2025-09-19 15:45:04.467	\N	\N	2915131884
6dba691f-6944-4c8e-8b7f-ebe07764af3f	Miqueas Benjamin Farfal	47739239	e0685444-0a84-46b8-9498-2cd34ccdb19e	d720e6f4-79f3-4b3c-a947-e5b93f572b84	t	f	2025-08-19 12:40:24.978	2025-09-19 15:45:25.185	\N	\N	2914261805
90ba8544-efb1-4d55-b176-b9cbb5e41f15	Sofia Elizabeth Flores	39877610	e0685444-0a84-46b8-9498-2cd34ccdb19e	d720e6f4-79f3-4b3c-a947-e5b93f572b84	t	f	2025-08-19 12:40:24.978	2025-09-19 15:47:47.679	\N	\N	2915030170
0f849724-1962-471c-b037-d2637ba9382b	Lucia Castares	34609586	5d001e99-643c-4267-b264-697ccbf4168c	2723140f-610e-4eef-81c3-cfb362ec12c4	t	f	2025-08-27 13:13:27.839	2025-09-19 15:49:37.488	\N	luciacastares@gmail.com	\N
2a575bb5-7ad1-445a-9635-0335d32ab2c3	Facundo Nicolas rosales 	23420913559	f052e834-c481-48cb-84c3-0480c91fa21a	b3c2c07e-c40a-4475-8463-30f755c09ff8	t	f	2025-08-24 19:16:50.6	2025-09-19 15:58:05.469	\N	\N	2974250817
8a511268-8959-4033-b5e3-6c3e759a6f7a	Diego Eduardo Gatti	45782319	c4ee85f4-1d83-4b91-8e9f-d2f01efcbe61	e49f8ce7-242a-4be1-8597-e77c8b4e9b65	t	f	2025-08-14 02:20:31.579	2025-09-19 16:03:27.877	\N	\N	2494360756
92a9d1ae-0175-45a4-a495-855b2dffa702	Oriana Isabella Belen Vasquez	53304117	aa30641d-c591-4ac8-8716-f25f469cc5cc	72a03507-451d-48d6-ac2e-d33fa374d500	t	f	2025-09-02 14:16:01.446	2025-09-19 15:58:15.171	\N	\N	2914025986
8b14c11c-7fb5-4d68-9e77-f45db6e85c00	Luciano Torino	43253991	2040f298-1146-4287-8c8e-96b3a95d87e8	b02a6678-d8be-4d0b-aa90-8a558b1fe6cd	t	f	2025-09-07 12:57:46.806	2025-09-19 16:04:45.008	\N	\N	2494556597
9c61e432-c48f-47ba-b6f0-09a226230f3a	Gustavo Ezequiel Rojas 	44169504	6d89f55c-1e27-4eb6-82f8-bb16504ddfaa	2cc81b7a-2800-49ed-a852-8e9e2b2d85ec	t	f	2025-08-14 02:20:25.292	2025-09-19 16:14:26.389	\N	\N	2914329120
611159f5-0895-43ef-aa40-f18714b1d946	Cecilia esther stang 	10572069	1df41bc3-d45c-438d-b5e5-b4132c785324	f0d5c3e9-3120-40f3-a5a6-689d7314bef8	t	f	2025-08-14 02:20:18.776	2025-09-19 18:20:39.971	\N	\N	\N
4774501b-b86f-45f2-83ea-0087ce22826b	Katherine Danariz Carrera	50148812	9314f731-06c9-42cf-a985-9bd3f32ef736	8b59dd93-2a4e-4450-9ab1-d5cda4d4091e	t	f	2025-08-19 12:40:33.269	2025-09-19 18:25:17.04	\N	\N	2914380853
e44cf565-db54-4c4f-aac6-1156e7d8b030	Juan David Cafferata	46827704	c263ea6f-50c5-42ed-aa2a-8182d7af6f09	e1798394-adcd-444d-b01b-0f1879dcbdca	t	f	2025-08-19 12:36:57.83	2025-09-19 19:40:19.437	\N	\N	2915102224
127c56b3-6ab6-42e9-9cea-06b33683e606	jeremias alexis bilbao silva	23524083809	269f53f3-2c24-4e9a-88ce-546c7105ec58	7e2fa770-93be-48c4-a8d4-ed4be9891c57	t	f	2025-08-25 13:36:26.15	2025-09-19 21:13:49.817	\N	\N	2915064141
46c48a34-ec4e-4d16-a06d-d768ded01462	lautaro naim silva	20521920882	269f53f3-2c24-4e9a-88ce-546c7105ec58	7e2fa770-93be-48c4-a8d4-ed4be9891c57	t	f	2025-08-25 13:36:26.15	2025-09-19 21:14:17.314	\N	\N	2915096025
6da88d42-9bac-4903-ba13-c75949f920f5	Francisco Andrés Maggini	20536791370	318697ff-cf59-4d6b-ac86-678d652eaa7b	e7193380-9747-42c3-9b7b-7e9366ec6257	t	f	2025-09-07 20:09:10.609	2025-09-19 21:14:33.522	\N	\N	2915204141
2c3e89c2-240e-48b9-b3a3-f4b1b1b248fd	dylan fabricio marcelo	2051179420	269f53f3-2c24-4e9a-88ce-546c7105ec58	7e2fa770-93be-48c4-a8d4-ed4be9891c57	t	f	2025-08-25 13:36:26.15	2025-09-19 21:17:43.929	\N	\N	\N
437e7c53-0985-49d7-a200-cc213a2db494	Silvana soledad bercu	31560532	ad18b7f4-f5fb-4e04-9fd8-1d16e1b00903	bd24b0aa-cf4b-436b-b235-6df0f62ecaa8	t	f	2025-08-14 02:00:39.003	2025-09-20 04:24:37.033	\N	\N	\N
6d90acad-6811-4867-862b-1b1effe594b4	Noelia Rodriguez	27340235016	125d1f65-8371-4384-940e-2ebee2ddbca8	b2dddc0f-f9a1-4b1a-80eb-c89428fc8ac6	t	f	2025-09-03 15:53:22.904	2025-09-19 21:22:05.382	\N	\N	2914717039
c3dd8ec9-39ac-4cf2-90ba-3ff0621d16b6	Fiorella Linares 	27531273090	5010fa60-0ac8-4ecd-9afa-7f0ef120ea85	f7be412f-6b3c-4f24-a6a7-800b321471d8	t	f	2025-09-02 01:04:48.648	2025-09-19 21:27:35.622	\N	\N	2914316294
d6814b44-c186-48b1-8308-fa35de436753	Brian angel bautista lopez	41232334	521b8b83-4b30-44c5-b712-c4ba44c378b2	cb1e6f03-859e-4bce-a526-1005b63a31ae	t	f	2025-09-08 12:00:52.543	2025-09-19 18:13:25.55	\N	\N	2914447663
1b97e22a-bec7-4af2-9f1f-3072d3d11624	Jesica Magali Galiano	29038855	5183358f-942b-4aae-a96b-12d44b868a2f	dfbcff7a-c864-4b35-ba1f-bfa40466faa1	f	f	2025-09-10 18:34:16.132	2025-09-10 18:34:16.132	\N	\N	\N
14273edd-c0b8-42eb-835e-fe6221a0f356	ELIZABETH RIFFO	92435311	de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	3245b0c2-5267-44ea-8d88-55c060562825	f	f	2025-09-12 13:37:08.379	2025-09-12 13:37:08.379	\N	\N	\N
1a2c0138-4bf4-4b56-afa5-a82bcde688bf	Jhonatan Balderrama 	949067634	8a4ed112-e7e1-4e44-b10a-baec620db2f9	890a12c0-4109-438d-a963-98f47d592c06	f	f	2025-09-14 23:06:32.188	2025-09-14 23:06:32.188	\N	\N	\N
22dd2bf3-e8d5-4d73-8570-317c8fbba7ce	Karina Lopez 	27322882187	2d661736-31f2-4061-a6f4-194c3393cdc1	9e55f65d-7efb-4d03-b871-d1ee92b8d0a7	f	f	2025-09-18 22:12:38.464	2025-09-18 22:12:38.464	\N	\N	\N
d6010fac-d375-4e49-8513-4d4c83df2f3a	Guido pintos 	20411354084	c1d8a6d2-86e3-42b4-bc53-0650fe7f1112	8aa229a0-afb0-414a-af36-c8ab45f19f44	f	f	2025-09-18 22:12:46.846	2025-09-18 22:12:46.846	\N	\N	\N
b93edef8-dceb-469e-b5cf-f6ea1ea70b16	Melany Ailen Marillan	44169525	fcc068fb-31c5-402b-b35e-97eca376b22c	ebc4fc79-4a9b-40af-9c23-ce7a3134d073	t	f	2025-09-15 01:37:37.23	2025-09-19 17:54:52.291	\N	\N	2914297375
1c3a46b8-b619-4a8c-a1d6-de262a9c418a	Abril Ihitz	27480210919	b9ddb67c-a934-4e78-88cc-9ae037a743b2	6678357a-116f-495c-b35c-3221d3b8db2d	f	f	2025-09-17 20:14:43.482	2025-09-17 20:14:43.482	\N	\N	\N
f7dada71-6ca2-494a-930d-f433c09f98bd	Sofia Aravena	27472822271	b9ddb67c-a934-4e78-88cc-9ae037a743b2	6678357a-116f-495c-b35c-3221d3b8db2d	f	f	2025-09-17 20:14:43.482	2025-09-17 20:14:43.482	\N	\N	\N
9ffc1ea9-4b63-450a-b873-6b95184f88cc	Celine Fuhr	27440074885	b9ddb67c-a934-4e78-88cc-9ae037a743b2	6678357a-116f-495c-b35c-3221d3b8db2d	f	f	2025-09-17 20:14:43.482	2025-09-17 20:14:43.482	\N	\N	\N
4af0a541-e4b9-4ea9-870c-7956559a59e7	Wanda  lezcano	27530646179	fd54c0ee-0eaa-4455-9295-94aaae3bad20	4e48f99b-524f-4e3d-9218-af262534a979	f	f	2025-09-19 03:10:43.508	2025-09-19 03:10:43.508	\N	\N	\N
556f1619-bc39-4c4b-a79e-01a6a67fc45f	Elsa uboldi	4518121	6d740945-2c87-4ebb-991e-6b548e61dfee	c39aaae6-9f73-4137-9340-3517b4da675f	t	f	2025-09-17 11:38:31.006	2025-09-19 15:37:27.934	\N	\N	\N
22db33b3-2e1c-4296-80be-4bfba074ecb8	Lidia Berenice Daniela Jacquez	27460942328	9c7e5886-83f4-4dc4-adec-af58c9095e25	d3bcff66-26e6-4294-9091-16f9c815123f	t	f	2025-09-12 10:33:01.782	2025-09-19 15:41:20.177	\N	\N	2916494605
9485e432-d8ab-40b5-96b4-cc302155f9d6	Samuel Lujan	46534858	9612b10b-ac50-4851-8356-694b5cc68bbd	f2dbdcbe-fa40-4bba-8c2e-5c4a92cb721a	t	f	2025-09-10 18:34:04.479	2025-09-19 15:40:16.168	\N	lujsam14@gmail.com	2914638191
0f0b40be-4177-490d-85c6-1ca44c21f969	Lucas Castares	20375553458	fd6f44b1-a016-4e6b-b741-355edfc41f1a	24d5f2ff-b0b4-4922-a8e8-d93c1246da40	t	f	2025-09-17 20:19:17.239	2025-09-19 15:46:18.266	\N	\N	\N
dd6d984c-2abe-402f-aed7-83de7a16bd18	Toro matias 	46813575	c7e8c25a-8415-493d-a6c3-a40888096861	d642fe5a-d37e-43fc-b30e-ab0937309738	f	f	2025-09-19 15:49:01.894	2025-09-19 15:49:01.894	\N	\N	\N
736076f1-c74e-49ca-90f9-5fcb3ecf5529	ROCIO ESCOBAR	41431328	de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	3245b0c2-5267-44ea-8d88-55c060562825	t	f	2025-09-12 13:37:08.379	2025-09-19 17:11:31.49	\N	\N	\N
19192734-96fe-4969-88d0-f00d46f0af57	Candela Eluney Paillán 	50889993	a3031c49-449f-46a6-82bc-02c02bcca443	ea628d57-624f-4a65-9871-33615a4a4f25	t	f	2025-09-19 12:40:08.309	2025-09-19 16:06:02.459	\N	\N	2915060036
97d17430-498a-4d92-aea6-5acd2ebaddaa	Bianca Aylen Paillán	48581382	2840a13b-3a77-45c0-b015-3f9122efe211	155d3b9e-b538-4da6-b190-3ca3eef12633	t	f	2025-09-15 01:35:10.366	2025-09-19 16:06:44.606	\N	\N	2915247783
5f12b637-e280-4d4b-9ad9-48fbd9c67bf8	DAVID ESCOBAR	25576702	de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	3245b0c2-5267-44ea-8d88-55c060562825	t	f	2025-09-12 13:37:08.379	2025-09-19 16:11:13.691	\N	\N	2914196294
f33182b4-985f-4261-99c0-1233e24e8924	CLARIBEL ESCOBAR	41431329	de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	3245b0c2-5267-44ea-8d88-55c060562825	t	f	2025-09-12 13:37:08.379	2025-09-19 16:11:42.806	\N	\N	2916443006
2a4ab024-e09e-4094-9def-1cdda3cfe268	Dalmiro Nahuel Sáez	20463385573	40302f89-61bd-43cc-8b33-7c15169db372	8364dc53-fbb2-4133-91e7-9fe5e6840508	t	f	2025-09-18 19:42:26	2025-09-19 16:14:01.42	\N	\N	2914414265
0df98110-8ad0-46b9-8fa7-cdc1be34962d	juan gabriel yllesca	46640008	c7e8c25a-8415-493d-a6c3-a40888096861	d642fe5a-d37e-43fc-b30e-ab0937309738	t	f	2025-09-19 15:49:01.894	2025-09-19 16:44:05.788	\N	\N	2915271890
7779b1b1-e844-4208-9ce4-867200ec4ab9	Isai robledo	48689304	362b77be-9452-43c4-a542-5e2676bee241	6061154d-cbad-4f61-aedc-3da64818d21b	t	f	2025-09-19 15:51:51.291	2025-09-19 16:44:35.846	\N	\N	2932510339
1547cdec-2cff-4ad2-9fc2-2a3f5e22d1f1	Brisa Ihitz	27514583329	b9ddb67c-a934-4e78-88cc-9ae037a743b2	6678357a-116f-495c-b35c-3221d3b8db2d	t	f	2025-09-17 20:14:43.482	2025-09-19 16:55:01.805	\N	\N	2914055727
84dd58bf-03a9-4739-ba64-edee414d328e	Jonathan ezequiel roth	20352198448	33ba851d-ba10-4abd-80aa-dbecb27b1fef	b376ec44-52ef-4bc8-aaa6-47c1299f6e3e	t	f	2025-09-16 15:54:30.779	2025-09-19 21:03:13.828	\N	\N	\N
abf6e7b9-3df4-4b88-948f-47330ec03fe1	Morena Ailin Santana 	27481066986	0bb3b3d5-ff72-4e2e-8a24-d7da79b8641b	f54b10d5-4ca3-4766-8027-8f4507417a78	t	f	2025-09-18 02:43:20.948	2025-09-19 18:31:40.88	\N	\N	2915245602
267510d7-1397-4337-877c-c899c97d46e7	Mateo Iván Riquelme	20485006770	8fd66d48-816b-40fe-8f15-2b79ab88b68d	67e434be-aef7-4597-8a30-c750d615b677	t	f	2025-09-18 16:15:33.69	2025-09-19 18:32:08.597	\N	\N	2914440688
ad179d6c-aed3-405b-b3b8-f417c2eceb40	Nazareno gaston	20471094154	2c9431cb-38ec-4f3d-8593-573bb910d153	2df59570-6a80-4204-b8f4-245c38012d9f	t	f	2025-09-10 19:31:54.659	2025-09-19 19:34:08.23	\N	\N	2914461836
f820a4c3-d091-41ae-beee-aff9f0c6ad9a	Raúl Sebastián Pon	31371188	62b11c0e-ffc6-44e3-8a16-9b6ffc1821d8	8afc8b36-dbda-43b1-86f8-15dac06260ec	t	f	2025-09-10 18:34:25.542	2025-09-19 20:25:30.565	\N	\N	2914757434
388c1a46-2807-4d9d-bb07-785e5b393127	Ludmila Yazmin Roth	20359882373	8cf612ec-cf8e-4dea-9bc5-1b326dd19d84	b7e9c479-e3fd-490e-bd06-866833a86ba8	t	f	2025-09-18 17:23:15.953	2025-09-19 20:27:24.336	\N	\N	2914126889
5b9687e4-03ca-4fc7-bed8-a79fa7a8b504	Yamila anahi estrada	27349451862	33ba851d-ba10-4abd-80aa-dbecb27b1fef	b376ec44-52ef-4bc8-aaa6-47c1299f6e3e	t	f	2025-09-16 15:54:30.779	2025-09-19 21:03:22.314	\N	\N	\N
ca690bd3-d8d3-4046-9483-4abf860ff0c4	Luna anabel roldan	27526132357	33ba851d-ba10-4abd-80aa-dbecb27b1fef	b376ec44-52ef-4bc8-aaa6-47c1299f6e3e	t	f	2025-09-16 15:54:30.779	2025-09-19 21:03:38.304	\N	\N	\N
b5429e98-53f3-465a-9922-7b20c65c5b07	Liz morena pirinoli	27526503444	33ba851d-ba10-4abd-80aa-dbecb27b1fef	b376ec44-52ef-4bc8-aaa6-47c1299f6e3e	t	f	2025-09-16 15:54:30.779	2025-09-19 21:03:59.457	\N	\N	\N
7fec8570-1913-499e-9137-4623ddad9395	Alma Mesa	27524079742	1c71bd79-5ee0-408e-aa1a-608449b35ee0	a86238d2-f108-4475-8888-59bf42ddb594	t	f	2025-09-08 21:39:15.654	2025-09-19 21:16:43.957	\N	\N	\N
3b42da3f-038f-4a4b-b602-6fc81c319c2d	Nicole ludmila  Beldrio 	27508400859	0fd52337-3aa5-4bc8-bdda-48dc73396bf5	50c492dc-d293-4692-9f2f-b0d5c7c161bf	t	f	2025-09-16 15:47:42.956	2025-09-19 21:13:26.17	\N	\N	2914604832
bdec2db6-1b73-44e2-b3f5-b3c725b06b71	Dylan Ezer Carballo	20515911848	e65e175f-02a9-4fee-8ee2-d2f42f68be8e	981f3c07-3118-431b-a1a0-b37af91b0dbb	t	f	2025-09-17 18:20:51.605	2025-09-19 21:18:49.948	\N	\N	2916421706
23c90297-c41b-4eae-b62b-c66197b439ad	Fabian Beldrio 	20322725340	ca489adf-ae2a-445c-a570-74233b12df42	d0d0cc9b-a365-4565-a569-9cd72572a27f	t	f	2025-09-16 15:47:55.647	2025-09-19 21:22:37.563	\N	\N	2914717039
e38ad1ff-0ced-4f53-abec-d9469d63df1e	Dylan Ihitz	20511793336	b9ddb67c-a934-4e78-88cc-9ae037a743b2	6678357a-116f-495c-b35c-3221d3b8db2d	t	f	2025-09-17 20:14:43.482	2025-09-19 15:49:25.754	\N	luciacastares@gmail.com	\N
b26ad79a-21ce-45d1-97ec-47079e51e5f5	Mateo leandro vega	48923353	bef928ae-229a-414c-a48a-b3e1a9df341f	a69d1902-64ee-4990-9460-055fe509844c	t	f	2025-08-30 22:55:01.492	2025-09-19 16:00:01.041	\N	vmateovega08@gmail.com	2915103082
bc3a253c-790a-41bf-ae1c-4ce72bfab659	Maxi ihitz	39877481	362b77be-9452-43c4-a542-5e2676bee241	6061154d-cbad-4f61-aedc-3da64818d21b	t	f	2025-09-19 15:51:51.291	2025-09-19 16:01:55.28	\N	\N	2915164009
4482d79f-0274-4d0c-985b-b48bcecf1af6	Jazmin Dedeugd	49517664	0fd1cc40-58dd-456a-97ec-51dc30e5773d	3e7b0885-2c51-4a19-80be-81c24cae1a19	t	f	2025-09-19 16:38:57.779	2025-09-19 16:41:33.15	\N	\N	2915662050
991392d6-d976-4a0a-a9a1-c1b8471f671c	Camila Mardones	49931597	f7547704-d6f5-4beb-b745-8b3d92177e34	6bce9e2b-1b7a-4dff-8454-4b07d77e8127	t	f	2025-09-19 16:40:41.765	2025-09-19 16:41:56.201	\N	\N	2914184734
20eb758e-1f6b-4996-bd65-b5a01b21fb52	Maria Belen Arias	46114510	c008e94b-545f-4276-aa12-ea18f51ec76d	9e3f6e92-02da-4367-bdbf-1ca0f8917668	t	f	2025-09-19 15:53:48.927	2025-09-19 16:42:24.183	\N	\N	2915272496
07bbba6b-7360-44bd-9b13-1f378ec85e5a	Marcos Rivero	48092439	362b77be-9452-43c4-a542-5e2676bee241	6061154d-cbad-4f61-aedc-3da64818d21b	t	f	2025-09-19 15:51:51.291	2025-09-19 16:42:48.766	\N	\N	2914716379
d6554dc5-aab6-4969-a57e-431278a2481c	Misael Robledo	45943099	572a5de8-a018-4b8a-aa2b-e22bdeac532b	aa0ab06c-6092-4715-9abc-a36722951afe	t	f	2025-09-19 17:08:59.723	2025-09-19 17:09:26.977	\N	\N	2932515852
4625ef07-cfa9-41b7-bd1c-f6d0a679ad85	FEDERICO BUENO	39482504	de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	3245b0c2-5267-44ea-8d88-55c060562825	t	f	2025-09-12 13:37:08.379	2025-09-19 17:31:18.542	\N	\N	2914402945
6f2d422c-a458-43d8-8599-0e897bc726dd	Tatiana beldrio	54289573	2b4ae258-f7e1-4db7-814f-e79a168766fa	b2a72db3-125c-41cb-9b8b-aa4f2f0f05b5	t	f	2025-09-20 12:16:19.359	2025-09-20 12:22:43.729	\N	\N	\N
99b627d3-5e79-4161-90f0-b1f7732e48b5	Josefina Beldrio	51053284	72b66672-b6e0-462e-be69-8aecb585631d	dc09ae9b-6e06-4038-ac8e-19be99ddcd0b	t	f	2025-09-19 18:12:45.774	2025-09-19 18:14:44.445	\N	\N	2915058955
463d03c4-3e25-410b-9d6c-e15c1c9a4a15	Pil María 	32271769	2b4ae258-f7e1-4db7-814f-e79a168766fa	b2a72db3-125c-41cb-9b8b-aa4f2f0f05b5	t	f	2025-09-20 12:16:19.359	2025-09-20 12:23:14.901	\N	\N	2914604090
5495fc65-b2fa-4c49-8e1c-e9d3bccf4b09	Lucia Pérez	48165145	f2f3454c-8b13-4f8f-b74a-088a76f32426	c6cfdefe-8ba9-4908-8f49-5da99a7bfee9	t	f	2025-09-19 18:30:14.293	2025-09-19 18:33:05.412	\N	\N	2914323614
cf9dc4c9-0714-459c-9e8d-841b84c046e6	Isabela Esparza	54128193	2b4ae258-f7e1-4db7-814f-e79a168766fa	b2a72db3-125c-41cb-9b8b-aa4f2f0f05b5	t	f	2025-09-20 12:16:19.359	2025-09-20 12:23:38.181	\N	\N	\N
ff87e798-1cc4-424d-91ab-b9079504ce65	Paula brossy	33799610	831d6b77-f991-475d-9ce9-b6543880aee6	03ba925b-0d31-4685-84ff-17ab6342dc6c	t	f	2025-09-19 18:35:42.946	2025-09-19 18:36:38.749	\N	\N	2914070827
4c165e33-6e96-45ea-a18a-536a5eb0a358	Marcos Toledo 	41580236	96fc1582-2cf4-4066-a6ac-0710c6cf42b7	7009a05e-5e8b-43cf-8da1-3a1a7a21cbc1	t	f	2025-09-19 20:19:59.341	2025-09-19 20:20:41.364	\N	\N	2915020710
f96063b9-5eac-4d6d-b66a-760d5238c55d	Sebastian soria	30062058	c7e8c25a-8415-493d-a6c3-a40888096861	d642fe5a-d37e-43fc-b30e-ab0937309738	f	f	2025-09-19 15:49:01.894	2025-09-19 20:25:10.514	\N	\N	2916436213    
0f4541b8-2e19-4be0-b5af-420f863cc819	Joaquín zweedijk 	52035951	98b6448a-b035-46aa-9f40-ff51fc655f17	0c07840b-8a7a-44dc-af18-8cc2d821b3c9	t	f	2025-09-02 15:39:34.472	2025-09-19 21:15:24.894	\N	\N	92932578329
eba46df7-2e8f-40c8-8524-f1812b4aec5d	Nicolás adrobe 	39957841	e9d137c5-9d58-4915-b7f7-000473487e52	358f1a7a-0b1b-4f9e-a0bf-7f7775e8c8b4	t	f	2025-09-20 12:19:57.13	2025-09-20 12:24:10.414	\N	\N	2915081992
5a8b676c-e992-42cb-9b40-3034e76167cd	Carolina belen Montaño	36757488	e9d137c5-9d58-4915-b7f7-000473487e52	358f1a7a-0b1b-4f9e-a0bf-7f7775e8c8b4	t	f	2025-09-20 12:19:57.13	2025-09-20 12:24:41.949	\N	\N	2804001939
b9fa1812-b8d6-417f-b6e0-ee28af98595d	Melody Montenegro	54225310	e9d137c5-9d58-4915-b7f7-000473487e52	358f1a7a-0b1b-4f9e-a0bf-7f7775e8c8b4	t	f	2025-09-20 12:19:57.13	2025-09-20 12:25:03.88	\N	\N	\N
888d0445-8f02-459a-958f-7cd16e7524e1	Mateo Ocampo	20435966412	95c58377-51bf-4de1-b23d-cb9bccfe3ff4	1d9dfae2-aa4f-4b2c-b753-2ad8cf0c5afc	f	f	2025-09-20 16:54:45.652	2025-09-20 16:54:45.652	\N	\N	\N
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."Order" (id, year, "userId", "eventId", total, status, "paymentType", "externalReference", "metadataToken", "preferenceId", "createdAt", "updatedAt", "deletedAt", cuil, email, phone) FROM stdin;
a3c9e3d0-29e6-4ff6-8d33-12d6a7bac0d3	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	TRANSFER	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYTNjOWUzZDAtMjllNi00ZmY2LThkMzMtMTJkNmE3YmFjMGQzIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InJvY2lvc290bzAzQGhvdG1haWwuY29tIiwiY3VpbCI6IjI3MzI1MjgxMDg3IiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IlJvY8OtbyBTb3RvIEd1ZXJyZXJvICIsImN1aWwiOiIyNzMyNTI4MTA4NyJ9XSwiaWF0IjoxNzU0Mzg5MTU1fQ.DQ8n4mJEOBenty7WxCrVk6hmJBMDbGnoxKQNXj4UT5U	\N	2025-08-05 10:19:15.03	2025-08-12 03:21:19.301	\N	27325281087	rociosoto03@hotmail.com	\N
d37094c0-8e12-48df-8635-e794b75a1ab5	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZDM3MDk0YzAtOGUxMi00OGRmLTg2MzUtZTc5NGI3NWExYWI1IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDA5NDQyMzUiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQ3Jpc3RpYW4gbWlndWVsIGJ1c3F1ZXQiLCJjdWlsIjoiNDA5NDQyMzcifV0sImlhdCI6MTc1NTEzNzEwN30.X9O1S8hpaNRP_hNX5s3MOUP3tqpYTKFaGPBgTsgj42A	\N	2025-08-14 02:05:07.528	2025-08-14 02:20:49.44	\N	40944235	padillabrian830@gmail.com	\N
4397a7fe-fee9-4ff7-a52c-40c08cb75dd6	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNDM5N2E3ZmUtZmVlOS00ZmY3LWE1MmMtNDBjMDhjYjc1ZGQ2IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDYxNTQyNzIiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiUHJpc2NpbGEgQnVkYXJldG8iLCJjdWlsIjoiNDYxNTQyNzIifV0sImlhdCI6MTc1NTEzNzE5Mn0.EogupKbUs2LDl-HdtVUeidKzgJqCMG5dAd1P1AcG3Ik	\N	2025-08-14 02:06:32.072	2025-08-14 02:20:43.137	\N	46154272	padillabrian830@gmail.com	\N
ad18b7f4-f5fb-4e04-9fd8-1d16e1b00903	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYWQxOGI3ZjQtZjVmYi00ZTA0LTlmZDgtMWQxNmUxYjAwOTAzIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiMzE1NjA1MzIiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiU2lsdmFuYSBzb2xlZGFkIGJlcmN1IiwiY3VpbCI6IjMxNTYwNTMyIn1dLCJpYXQiOjE3NTUxMzY3NTZ9.UPoZC89BnSwTxmltelVRnItYOzm5bIc9DvL6_sIMo-E	\N	2025-08-14 01:59:16.299	2025-08-14 02:00:38.997	\N	31560532	padillabrian830@gmail.com	\N
775c12e9-1bad-4a36-908d-1479e7c36f79	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNzc1YzEyZTktMWJhZC00YTM2LTkwOGQtMTQ3OWU3YzM2Zjc5IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiMzE5OTQ0MDAiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWFyaWEgZGUgbG9zIGFuZ2VsZXMgYmVsbGVnaWEiLCJjdWlsIjoiMzE5OTQ0MDAifV0sImlhdCI6MTc1NTEzNzMwMX0.mBZWJ-eD4YGYQR6Qz-4dw1-iDt_U879LYmKcTX3dNx4	\N	2025-08-14 02:08:21.864	2025-08-14 02:20:37.084	\N	31994400	padillabrian830@gmail.com	\N
c4ee85f4-1d83-4b91-8e9f-d2f01efcbe61	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYzRlZTg1ZjQtMWQ4My00YjkxLThlOWYtZDJmMDFlZmNiZTYxIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDU3ODIzMTkiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiRGllZ28gRWR1YXJkbyBHYXR0aSIsImN1aWwiOiI0NTc4MjMxOSJ9XSwiaWF0IjoxNzU1MTM3MzU2fQ.839s7lKUl57YbsZKIWB1jLKlVPVo2Z0SELg2X1DYRyY	\N	2025-08-14 02:09:16.652	2025-08-14 02:20:31.576	\N	45782319	padillabrian830@gmail.com	\N
6d89f55c-1e27-4eb6-82f8-bb16504ddfaa	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNmQ4OWY1NWMtMWUyNy00ZWI2LTgyZjgtYmIxNjUwNGRkZmFhIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDQxNjk1MDQiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiR3VzdGF2byBFemVxdWllbCBSb2phcyAiLCJjdWlsIjoiNDQxNjk1MDQifV0sImlhdCI6MTc1NTEzNzQ5OH0.vmGJHnswuk4TY0Y3SI-pafkdnyn7QeVDV5Tl5nnRebc	\N	2025-08-14 02:11:38.275	2025-08-14 02:20:25.289	\N	44169504	padillabrian830@gmail.com	\N
1df41bc3-d45c-438d-b5e5-b4132c785324	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMWRmNDFiYzMtZDQ1Yy00MzhkLWI1ZTUtYjQxMzJjNzg1MzI0IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiMTA1NzIwNjkiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQ2VjaWxpYSBlc3RoZXIgc3RvbmciLCJjdWlsIjoiMTA1NzIwNjkifV0sImlhdCI6MTc1NTEzNzcwMH0.Szw4GsNIBNt1svGPtg_aONpDZ9cXZu62v9IIJ9vhiWc	\N	2025-08-14 02:15:00.437	2025-08-14 02:20:18.772	\N	10572069	padillabrian830@gmail.com	\N
9a955561-c2e6-45da-850e-bfdb5abb4ec8	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOWE5NTU1NjEtYzJlNi00NWRhLTg1MGUtYmZkYjVhYmI0ZWM4IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDI4MTAxNzciLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTGF1cmEgQW5nZWwiLCJjdWlsIjoiNDI4MTAxNzcifV0sImlhdCI6MTc1NTEzNzgyNX0.mD7o_x_q1nLG5wBVGjgIrFcs8oVPZ2WqVqITTD7f5Is	\N	2025-08-14 02:17:05.434	2025-08-14 02:20:12.419	\N	42810177	padillabrian830@gmail.com	\N
7e82d91a-b880-4f0e-bd85-b52d498d7ff8	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiN2U4MmQ5MWEtYjg4MC00ZjBlLWJkODUtYjUyZDQ5OGQ3ZmY4IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDY1NjEzNjkiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQXJhY2XDsWkgUml2ZXJhIiwiY3VpbCI6IjQ2NTYxMzY5In1dLCJpYXQiOjE3NTUxMzc4NzZ9.HTbBXJVkdBP6Q8CPIOHq3Cm3ZqGIg3bwO3zBLTOWCPU	\N	2025-08-14 02:17:56.34	2025-08-14 02:20:04.919	\N	46561369	padillabrian830@gmail.com	\N
c263ea6f-50c5-42ed-aa2a-8182d7af6f09	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYzI2M2VhNmYtNTBjNS00MmVkLWFhMmEtODE4MmQ3YWY2ZjA5IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDY4Mjc3MDQiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiSnVhbiBEYXZpZCBDYWZmZXJhdGEiLCJjdWlsIjoiNDY4Mjc3MDQifV0sImlhdCI6MTc1NTYwNzAwMX0.G0W79AGt9KSy9RVqA83pA-B2-x_JkmVH5OHT2JMsixw	\N	2025-08-19 12:36:41.779	2025-08-19 12:36:57.823	\N	46827704	padillabrian830@gmail.com	\N
ea780860-a31a-4195-985c-73fe952a967c	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PENDING	TRANSFER	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZWE3ODA4NjAtYTMxYS00MTk1LTk4NWMtNzNmZTk1MmE5NjdjIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Implc3VzZXNwYXJhdGlAbGl2ZS5jb20uYXIiLCJjdWlsIjoiMjYxMzU2OTA4MDAiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQW5hIE1hcmlhIFBlcmV5cmEiLCJjdWlsIjoiMjYxMzU2OTA4MDAifV0sImlhdCI6MTc1NTg1NzQ1N30.v3FTsK3L2nRuMPEnYKc0_-cBae_NO_hFswylDo9ZH3Y	\N	2025-08-22 10:10:57.35	2025-08-22 10:10:57.358	\N	26135690800	jesusesparati@live.com.ar	\N
e0685444-0a84-46b8-9498-2cd34ccdb19e	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	50000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZTA2ODU0NDQtMGE4NC00NmI4LTk0OTgtMmNkMzRjY2RiMTllIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6ImNmMTJmMzU4LWFiM2QtNDRlNC04MTJjLTc5NDhmZWJmMjg3NiIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDIxOTUzNDMiLCJ0b3RhbEFtb3VudCI6NTAwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiUm9jaW8gQW50b25lbGxhIEZhcmZhbCIsImN1aWwiOiI0MjE5NTM0MyJ9LHsibmFtZSI6Ik1pcXVlYXMgQmVuamFtaW4gRmFyZmFsIiwiY3VpbCI6IjQ3NzM5MjM5In0seyJuYW1lIjoiU29maWEgRWxpemFiZXRoIEZsb3JlcyIsImN1aWwiOiIzOTg3NzYxMCJ9XSwiaWF0IjoxNzU1NjA3MjA2fQ.lPhtsls_fj2MOc0sGi8GMD0-_pPvCgc_08PkBJTy42g	\N	2025-08-19 12:40:06.913	2025-08-19 12:40:24.973	\N	42195343	padillabrian830@gmail.com	\N
9314f731-06c9-42cf-a985-9bd3f32ef736	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOTMxNGY3MzEtMDZjOS00MmNmLWE5ODUtOWJkM2YzMmVmNzM2IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNTAxNDg4MTIiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiS2F0aGVyaW5lIERhbmFyaXogQ2FycmVyYSIsImN1aWwiOiI1MDE0ODgxMiJ9XSwiaWF0IjoxNzU1NjA3MDY2fQ.AJO6XrEAH-tgFISViwcz3IxrsBrm2rGFbuAJ7VVV6oI	\N	2025-08-19 12:37:46.385	2025-08-19 12:40:33.266	\N	50148812	padillabrian830@gmail.com	\N
d143bd1d-957a-4e30-bbe8-5c3905a39f0d	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PENDING	TRANSFER	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZDE0M2JkMWQtOTU3YS00ZTMwLWJiZTgtNWMzOTA1YTM5ZjBkIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Imx1Y2lhY2FzdGFyZXNAZ21haWwuY29tIiwiY3VpbCI6IjI3MzQ2MDk1ODYwIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkR5bGFuIGloaXR6IiwiY3VpbCI6IjIwNTExNzkzMzM2In1dLCJpYXQiOjE3NTU5NDg5NzJ9.UdNKO3gFvSRrisReUh2IzeB28SmB1s1_1BUJLFF56UQ	\N	2025-08-23 11:36:12.64	2025-08-23 11:36:12.651	\N	27346095860	luciacastares@gmail.com	\N
269f53f3-2c24-4e9a-88ce-546c7105ec58	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	108000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMjY5ZjUzZjMtMmMyNC00ZTlhLTg4Y2UtNTQ2YzcxMDVlYzU4IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjAzNzlkN2NiLTgxMWItNDFkOC04OTY5LWIwODY1NTQ2NzkzMSIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiMjA0MjQ2OTU3MyIsInRvdGFsQW1vdW50IjoxMDgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiamVyZW1pYXMgYWxleGlzIGJpbGJhbyBzaWx2YSIsImN1aWwiOiIyMzUyNDA4MzgwOSJ9LHsibmFtZSI6Im1pYSBhaW1lZSB2ZWlzYWdhIGh1ZW51cGkiLCJjdWlsIjoiMjc1MDc4NTczMTIifSx7Im5hbWUiOiJicnVubyB0b21hcyBtZXJsb3oiLCJjdWlsIjoiMjA1MjYxMzEyNTkifSx7Im5hbWUiOiJtaWxvIGJhdXRpc3RhIG1lcmxveiBiZWxkcmlvIiwiY3VpbCI6IjIwNTMyOTA2ODMxIn0seyJuYW1lIjoiZHlsYW4gZmFicmljaW8gbWFyY2VsbyIsImN1aWwiOiIyMDUxMTc5NDIwIn0seyJuYW1lIjoibGF1dGFybyBuYWltIHNpbHZhIiwiY3VpbCI6IjIwNTIxOTIwODgyIn0seyJuYW1lIjoiYSBjb25maXJtYXIgcG9yIG5vZSIsImN1aWwiOiI0MjQ2OTU2NSJ9XSwiaWF0IjoxNzU2MTI4NjcwfQ.qYKfaJYSt9Rr0MiQ50iWVVLWjLVB4S9uKImkAcG6GuA	\N	2025-08-25 13:31:10.73	2025-08-25 13:36:26.143	\N	2042469573	padillabrian830@gmail.com	\N
f052e834-c481-48cb-84c3-0480c91fa21a	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	TRANSFER	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZjA1MmU4MzQtYzQ4MS00OGNiLTg0YzMtMDQ4MGM5MWZhMjFhIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6IkZhY3VuZG9yb3NhbGVzMzMyQGdtYWlsLmNvbSIsImN1aWwiOiIyMzQyMDkxMzU1OSIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJGYWN1bmRvIE5pY29sYXMgcm9zYWxlcyAiLCJjdWlsIjoiMjM0MjA5MTM1NTkifV0sImlhdCI6MTc1NTY1OTcwOH0.2e5CkxhTBoGHsGVP0SO4_8ujuCUmfKnsSwjpSzHfric	\N	2025-08-20 03:15:08.243	2025-08-24 19:16:50.595	\N	23420913559	Facundorosales332@gmail.com	\N
5d001e99-643c-4267-b264-697ccbf4168c	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNWQwMDFlOTktNjQzYy00MjY3LWIyNjQtNjk3Y2NiZjQxNjhjIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Ikx1Y2lhY2FzdGFyZXNAZ21haWwuY29tIiwiY3VpbCI6IjM0NjA5NTg2IiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6Ikx1Y2lhIENhc3RhcmVzIiwiY3VpbCI6IjM0NjA5NTg2In1dLCJpYXQiOjE3NTYzMDAzOTR9.iUljOBSec88s4oM906Zr_UUQYB3dqErmT7jfNXuYGyc	\N	2025-08-27 13:13:14.024	2025-08-27 13:13:27.833	\N	34609586	Luciacastares@gmail.com	\N
bef928ae-229a-414c-a48a-b3e1a9df341f	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYmVmOTI4YWUtMjI5YS00MTRjLWE0OGEtYjNlMWE5ZGYzNDFmIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InZtYXRlb3ZlZ2EwOEBnbWFpbC5jb20iLCJjdWlsIjoiNDg5MjMzNTMiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWF0ZW8gbGVhbmRybyB2ZWdhIiwiY3VpbCI6IjQ4OTIzMzUzIn1dLCJpYXQiOjE3NTY1OTQ0MTR9.tCV5n0cEn0rSvyMV5lBfOxHImon-9sBjvE87wWS3qD8	\N	2025-08-30 22:53:34.057	2025-08-30 22:55:01.486	\N	48923353	vmateovega08@gmail.com	\N
e5efab34-9e4e-4209-8452-220d45fa555c	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZTVlZmFiMzQtOWU0ZS00MjA5LTg0NTItMjIwZDQ1ZmE1NTVjIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNDg5OTQ0OTAiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTmljb2xhcyBFbGlzZW8gSm9uYXTDoW4gVmFzcXVleiIsImN1aWwiOiI0ODk5NDQ5MCJ9XSwiaWF0IjoxNzU2ODIyNDg3fQ.knS-wSCRwXjNYszEDT_pKAhLDXZ71BP2BBM2pflRLQk	\N	2025-09-02 14:14:47.95	2025-09-02 14:15:38.594	\N	48994490	padillabrian830@gmail.com	\N
5010fa60-0ac8-4ecd-9afa-7f0ef120ea85	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNTAxMGZhNjAtMGFjOC00ZWNkLTlhZmEtN2YwZWYxMjBlYTg1IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1hcmllbGFtYXJ0aW5vNDFAaG90bWFpbC5jb20iLCJjdWlsIjoiMjczMDA2MjE4MjciLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiRmlvcmVsbGEgTGluYXJlcyAiLCJjdWlsIjoiMjc1MzEyNzMwOTAifV0sImlhdCI6MTc1Njc3Mjk2NX0.irsp_M9EUENTLNlfLNqrN22ZzWRxYn3l4AEpq5lD4dA	\N	2025-09-02 00:29:25.721	2025-09-02 01:04:48.641	\N	27300621827	marielamartino41@hotmail.com	\N
01db1715-d4e4-4803-86aa-c29a8c7beafb	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMDFkYjE3MTUtZDRlNC00ODAzLTg2YWEtYzI5YThjN2JlYWZiIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InJvbWluYXJvc2FsZXM1NDJAZ21haWwuY29tIiwiY3VpbCI6IjIwNDMxODU4NzE3IiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IlJvbWluYSBSb3NhbGVzIiwiY3VpbCI6IjIwNDMxODU4NzE3In1dLCJpYXQiOjE3NTY5MzQ0NDN9.ks0iU0LsIHe-OpLXFowcZYjtFEIYGRAYevIDNMx3p_I	\N	2025-09-03 21:20:43.663	2025-09-04 00:10:39.387	\N	20431858717	rominarosales542@gmail.com	\N
ab71bba6-d187-4992-88a1-3eea683bceb5	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYWI3MWJiYTYtZDE4Ny00OTkyLTg4YTEtM2VlYTY4M2JjZWI1IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1hcmliZWxhcmVsbGFub3VuaUBnbWFpbC5jb20iLCJjdWlsIjoiMjc0MzY3MDE2MDMiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWFyaWJlbCBBcmVsbGFubyIsImN1aWwiOiIyNzQzNjcwMTYwMyJ9XSwiaWF0IjoxNzU2ODY3ODUzfQ.vImXOOI7JRp3QqLMW58KlZDu4xyIF_rhj-nE9jS8ihM	\N	2025-09-03 02:50:53.946	2025-09-03 10:36:27.177	\N	27436701603	maribelarellanouni@gmail.com	\N
aa30641d-c591-4ac8-8716-f25f469cc5cc	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYWEzMDY0MWQtYzU5MS00YWM4LTg3MTYtZjI1ZjQ2OWNjNWNjIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJjdWlsIjoiNTMzMDQxMTciLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiT3JpYW5hIElzYWJlbGxhIEJlbGVuIFZhc3F1ZXoiLCJjdWlsIjoiNTMzMDQxMTcifV0sImlhdCI6MTc1NjgyMjQyNn0.nb2rRycBcfQ0tsUdqox9COvz5gFDSCNgOvhOoT7BuJI	\N	2025-09-02 14:13:46.033	2025-09-02 14:16:01.442	\N	53304117	padillabrian830@gmail.com	\N
98b6448a-b035-46aa-9f40-ff51fc655f17	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOThiNjQ0OGEtYjAzNS00NmFhLTlmNDAtZmY1MWZjNjU1ZjE3IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1ham9ncmFuYWRhQGdtYWlsLmNvbSIsImN1aWwiOiIyNzI4ODIzMzkwNSIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJKb2FxdcOtbiB6d2VlZGlqayAiLCJjdWlsIjoiMjA1MjAzNTk1MTcifV0sImlhdCI6MTc1NjgxNzM1OX0._CmVKvUBBEf1kUoIkRNAKHOiGI9Aj93vTc7bVzT8zOw	\N	2025-09-02 12:49:19.68	2025-09-02 15:39:34.468	\N	27288233905	majogranada@gmail.com	\N
125d1f65-8371-4384-940e-2ebee2ddbca8	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	50000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMTI1ZDFmNjUtODM3MS00Mzg0LTk0MGUtMmViZWUyZGRiY2E4IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6ImNmMTJmMzU4LWFiM2QtNDRlNC04MTJjLTc5NDhmZWJmMjg3NiIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5vZWxpYXJvZHJpZ3VlenBlbHUuOTk5QGdtYWlsLmNvbSIsImN1aWwiOiIyNzM0MDIzNTAxIiwidG90YWxBbW91bnQiOjUwMDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkJlcmVuaWNlIFJlaXNzZXIiLCJjdWlsIjoiMjc0OTkxODI2NTcifSx7Im5hbWUiOiJKdWxpYW5hIFJlaXNzZXIiLCJjdWlsIjoiMjc1MzMwMDk4MDMifSx7Im5hbWUiOiJOb2VsaWEgUm9kcmlndWV6IiwiY3VpbCI6IjI3MzQwMjM1MDE2In1dLCJpYXQiOjE3NTY4Njg0MjF9.wBVK_ypK96QC37mh1grHx09RkoBqLUZAwK1h2y3nd_w	\N	2025-09-03 03:00:21.773	2025-09-03 15:53:22.897	\N	2734023501	noeliarodriguezpelu.999@gmail.com	\N
8a246caf-9ec7-4bb0-a474-2f12fa31864d	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOGEyNDZjYWYtOWVjNy00YmIwLWE0NzQtMmYxMmZhMzE4NjRkIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6ImRhbmllbGFicGFyZWRlc0Bob3RtYWlsLmNvbSIsInBob25lIjoiMjkxNTExOTk2MiIsImN1aWwiOiI0MjgzNjQ0MiIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJkYW5pZWxhIFBhcmVkZXMiLCJjdWlsIjoiNDI4MzY0NDIifV0sImlhdCI6MTc1NzAzNjgxNn0.rkqQb3f0kfXHdYbkxSb7psDPXFRjgJmfIJZi0X7-Hqg	\N	2025-09-05 01:46:56.712	2025-09-05 01:49:07.825	\N	42836442	danielabparedes@hotmail.com	2915119962
2040f298-1146-4287-8c8e-96b3a95d87e8	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMjA0MGYyOTgtMTE0Ni00Mjg3LThjOGUtOTZiM2E5NWQ4N2U4IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InZhbGVudGlub3RvbmVndXp6b0BnbWFpbC5jb20iLCJwaG9uZSI6IjkyNDk0NTUwNDM1IiwiY3VpbCI6IjIwNDcwMjk2OTkzIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6Ikx1Y2lhbm8gVG9yaW5vIiwiY3VpbCI6IjQzMjUzOTkxIn1dLCJpYXQiOjE3NTcyMDUzODl9.qkNKoPawHFGYQHURQwulYrLHjGSKOfaaJPQHYcA62B4	\N	2025-09-07 00:36:29.194	2025-09-07 12:57:46.8	\N	20470296993	valentinotoneguzzo@gmail.com	92494550435
521b8b83-4b30-44c5-b712-c4ba44c378b2	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNTIxYjhiODMtNGIzMC00NGM1LWI3MTItYzRiYTQ0YzM3OGIyIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjQxMjMyMzM0IiwiY3VpbCI6IjI5MTQ0NDc2NjMiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQnJpb24gYW5nZWwgYmF1dGlzdGEgbG9wZXoiLCJjdWlsIjoiMjkxNDQ0NzY2MyJ9XSwiaWF0IjoxNzU3MzMyODMzfQ.8vjxPDcH6MdAfmy6hI6Kq9UUwEIIDgfhVvj3gYeVuO4	\N	2025-09-08 12:00:33.169	2025-09-08 12:00:52.537	\N	2914447663	padillabrian830@gmail.com	41232334
2690b815-8432-40b1-a938-c05907b9b482	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMjY5MGI4MTUtODQzMi00MGIxLWE5MzgtYzA1OTA3YjliNDgyIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjQ1MzE0NDAwIiwiY3VpbCI6IjI5MTQ0NDc2NjgiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQWJpZ2FpbCBkZWJvcmEgdHJvc2NoYXN0ZXkiLCJjdWlsIjoiNDUzMTQ0MDAifV0sImlhdCI6MTc1NzMzMjczMH0.NicgkpkJo0hx1kYDogQXGCldzXbarX0UWDqMRm0vIQY	\N	2025-09-08 11:58:50.635	2025-09-08 12:01:08.174	\N	2914447668	padillabrian830@gmail.com	45314400
318697ff-cf59-4d6b-ac86-678d652eaa7b	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMzE4Njk3ZmYtY2Y1OS00ZDZiLWFjODYtNjc4ZDY1MmVhYTdiIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhcnJhbWVsYW55NzhAZ21haWwudm9tIiwicGhvbmUiOiIyOTE1NjYwNjcxIiwiY3VpbCI6IjI3NDM2NDIxMjg3IiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkZyYW5jaXNjbyBBbmRyw6lzIE1hZ2dpbmkiLCJjdWlsIjoiMjA1MzY3OTEzNzAifV0sImlhdCI6MTc1NzI2NTg4NX0.JGhs5M1HKsvePX6XvaI_gs37y324GtNqjpIb5W09oKc	\N	2025-09-07 17:24:45.415	2025-09-07 20:09:10.603	\N	27436421287	parramelany78@gmail.vom	2915660671
1c71bd79-5ee0-408e-aa1a-608449b35ee0	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMWM3MWJkNzktNWVlMC00MDhlLWFhMWEtNjA4NDQ5YjM1ZWUwIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5hZGlhYW5hYmVsdkBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTQzNTkyODAiLCJjdWlsIjoiMjczMjI1MzYwNjgiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQWxtYSBNZXNhIiwiY3VpbCI6IjI3NTI0MDc5NzQyIn1dLCJpYXQiOjE3NTczNjcyMDV9.WdC-LUUGa3t5urCCnSnETTlH0oeToCcC1RJHce93lWs	\N	2025-09-08 21:33:25.485	2025-09-08 21:39:15.649	\N	27322536068	nadiaanabelv@gmail.com	2914359280
5183358f-942b-4aae-a96b-12d44b868a2f	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNTE4MzM1OGYtOTQyYi00YWFlLWE5NmItMTJkNDRiODY4YTJmIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Implc2lnYWxpYW5vQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNTcxNTY1NyIsImN1aWwiOiIyOTAzODg1NSIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJKZXNpY2EgTWFnYWxpIEdhbGlhbm8iLCJjdWlsIjoiMjkwMzg4NTUifV0sImlhdCI6MTc1NzUyOTIzMX0.MG5IuEO-rJStwiO4OeLN1yQdTYo0aAkL3lPnCTC1cE0	\N	2025-09-10 18:33:51.127	2025-09-10 18:34:16.127	\N	29038855	jesigaliano@gmail.com	2915715657
2c9431cb-38ec-4f3d-8593-573bb910d153	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMmM5NDMxY2ItMzhlYy00ZjNkLTg1OTMtNTczYmI5MTBkMTUzIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5hemFyZW5vMThtYXJlQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNDQ2MTgzNiIsImN1aWwiOiIyMDQ3MTA5NDE1NCIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJOYXphcmVubyBnYXN0b24iLCJjdWlsIjoiMjA0NzEwOTQxNTQifV0sImlhdCI6MTc1NzM2NzgzNX0.CRnLD0uwrvo6-q3MNH9IG2U_5vlpJj4Uu76tWybQZlY	\N	2025-09-08 21:43:55.689	2025-09-10 19:31:54.653	\N	20471094154	nazareno18mare@gmail.com	2914461836
62b11c0e-ffc6-44e3-8a16-9b6ffc1821d8	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNjJiMTFjMGUtZmZjNi00NGUzLThhMTYtOWI2ZmZjMTgyMWQ4IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InJzZWJhcG9uQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNDc1NzQzNCIsImN1aWwiOiIzMTM3MTE4OCIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJSYcO6bCBTZWJhc3Rpw6FuIFBvbiIsImN1aWwiOiIzMTM3MTE4OCJ9XSwiaWF0IjoxNzU3NTI5MTgxfQ.M_eyU80LVtcJP5jmXJE58HRoZxBs8QWePWxngMh0D80	\N	2025-09-10 18:33:01.705	2025-09-10 18:34:25.538	\N	31371188	rsebapon@gmail.com	2914757434
9612b10b-ac50-4851-8356-694b5cc68bbd	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOTYxMmIxMGItYWM1MC00ODUxLTgzNTYtNjk0YjVjYzY4YmJkIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Imx1anNhbTE0QGdtYWlsLmNvbSIsInBob25lIjoiMjkxNDYzODE5MSIsImN1aWwiOiI0NjUzNDg1OCIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJTYW11ZWwgTHVqYW4iLCJjdWlsIjoiNDY1MzQ4NTgifV0sImlhdCI6MTc1NzUyOTEzM30.G87LGER_7mMrAqGY-n5uYomNZE3XqSMCWM3srThLNyk	\N	2025-09-10 18:32:13.634	2025-09-10 18:34:04.472	\N	46534858	lujsam14@gmail.com	2914638191
9c7e5886-83f4-4dc4-adec-af58c9095e25	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOWM3ZTU4ODYtODNmNC00ZGM0LWFkZWMtYWY1OGM5MDk1ZTI1IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6ImJlcmVuaWNlamFjcXVlejY2QGdtYWlsLmNvbSIsInBob25lIjoiMjkxNjQ5NDYwNSIsImN1aWwiOiIyNzQ2MDk0MjMyOCIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJMaWRpYSBCZXJlbmljZSBEYW5pZWxhIEphY3F1ZXoiLCJjdWlsIjoiMjc0NjA5NDIzMjgifV0sImlhdCI6MTc1NzYzNTQ5OX0._QFYqPcdK2zrjUqjoEiyvZocTNR6z_CxsySmyX36hW4	\N	2025-09-12 00:04:59.556	2025-09-12 10:33:01.773	\N	27460942328	berenicejacquez66@gmail.com	2916494605
2840a13b-3a77-45c0-b015-3f9122efe211	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMjg0MGExM2ItM2E3Ny00NWMwLWIwMTUtM2Y5MTIyZWZlMjExIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6ImJpYW5jYXBhaWxsYW4xQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNTI0Nzc4MyIsImN1aWwiOiI0ODU4MTM4MiIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJCaWFuY2EgQXlsZW4gUGFpbGzDoW4iLCJjdWlsIjoiNDg1ODEzODIifV0sImlhdCI6MTc1NzkwMDA3NX0.ZbpV45Suf-ManaYwZQ_L1yicQioBTAlfVkfNehqmwtg	\N	2025-09-15 01:34:35.391	2025-09-15 01:35:10.361	\N	48581382	biancapaillan1@gmail.com	2915247783
de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	82000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZGU5ZmQwOGItZjc1Mi00YjRiLWI2ZDgtMzZmZGJlNWQ1NGY1IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjQ2MjM5NGUzLTc5ZmMtNGY0Yi1iZTY4LTA0M2Y0ZDFhNmE4MiIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjAyOTE1MzUwMDQ0IiwiY3VpbCI6IjQyNDY5NTc5IiwidG90YWxBbW91bnQiOjgyMDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkRBVklEIEVTQ09CQVIiLCJjdWlsIjoiMjU1NzY3MDIifSx7Im5hbWUiOiJFTElaQUJFVEggUklGRk8iLCJjdWlsIjoiOTI0MzUzMTEifSx7Im5hbWUiOiJDTEFSSUJFTCBFU0NPQkFSIiwiY3VpbCI6IjQxNDMxMzI5In0seyJuYW1lIjoiUk9DSU8gRVNDT0JBUiIsImN1aWwiOiI0MTQzMTMyOCJ9LHsibmFtZSI6IkZFREVSSUNPIEJVRU5PIiwiY3VpbCI6IjM5NDgyNTA0In1dLCJpYXQiOjE3NTc2ODQxNjB9.BqCRemgPGmsdNTr4PjEwIs7xFY90E-a7gg3CSSggXpw	\N	2025-09-12 13:36:00.106	2025-09-12 13:37:08.37	\N	42469579	padillabrian830@gmail.com	02915350044
8a4ed112-e7e1-4e44-b10a-baec620db2f9	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOGE0ZWQxMTItZTdlMS00ZTQ0LWIxMGEtYmFlYzYyMGRiMmY5IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6ImJhbGRlcnJhbWFhbnphbGRvamhvbmF0YW5AZ21haWwuY29tIiwicGhvbmUiOiIyOTE0MDY3NjM0IiwiY3VpbCI6Ijk0OTA2MTIxIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6Ikpob25hdGFuIEJhbGRlcnJhbWEgIiwiY3VpbCI6Ijk0OTA2NzYzNCJ9XSwiaWF0IjoxNzU3ODkwMDUwfQ.oCyJLOHk6L_kZyv4TILXON_zOGfWfafwpCvYlO0igqQ	\N	2025-09-14 22:47:30.443	2025-09-14 23:06:32.182	\N	94906121	balderramaanzaldojhonatan@gmail.com	2914067634
fcc068fb-31c5-402b-b35e-97eca376b22c	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZmNjMDY4ZmItMzFjNS00MDJiLWIzNWUtOTdlY2EzNzZiMjJjIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1lbGFueS5haWxlbi5tYXJpbGxhbkBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwMzMiLCJjdWlsIjoiNDQxNjk1MjEiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWVsYW55IEFpbGVuIE1hcmlsbGFuIiwiY3VpbCI6IjQ0MTY5NTI1In1dLCJpYXQiOjE3NTc5MDAyMzJ9.2-jCrXxdO2FV71YVuPaFiOOLuwY3SSCbpz87uH4WJ0A	\N	2025-09-15 01:37:12.221	2025-09-15 01:37:37.226	\N	44169521	melany.ailen.marillan@gmail.com	2915350033
33ba851d-ba10-4abd-80aa-dbecb27b1fef	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	65000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMzNiYTg1MWQtYmExMC00YWJkLTgwYWEtZGJlY2IyN2IxZmVmIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6ImE4YWI0ZDEzLTJhZjktNGE5My1iOTkwLTFhMThlODU4MGU0ZiIsInF1YW50aXR5IjoxLCJlbWFpbCI6ImVzdHJhZGF5YW1pbGEyNUBvdXRsb29rLmNvbSIsInBob25lIjoiMjkxNjQ2ODgyNCIsImN1aWwiOiIyNzM0OTQ1MTg2MiIsInRvdGFsQW1vdW50Ijo2NTAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJKb25hdGhhbiBlemVxdWllbCByb3RoIiwiY3VpbCI6IjIwMzUyMTk4NDQ4In0seyJuYW1lIjoiWWFtaWxhIGFuYWhpIGVzdHJhZGEiLCJjdWlsIjoiMjczNDk0NTE4NjIifSx7Im5hbWUiOiJMdW5hIGFuYWJlbCByb2xkYW4iLCJjdWlsIjoiMjc1MjYxMzIzNTcifSx7Im5hbWUiOiJMaXogbW9yZW5hIHBpcmlub2xpIiwiY3VpbCI6IjI3NTI2NTAzNDQ0In1dLCJpYXQiOjE3NTgwMjIxMTR9.OP0gF3c-ksRc5R-c8nnaTI47pSh7kF42MdFmk8LVje0	\N	2025-09-16 11:28:34.825	2025-09-16 15:54:30.77	\N	27349451862	estradayamila25@outlook.com	2916468824
ca489adf-ae2a-445c-a570-74233b12df42	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiY2E0ODlhZGYtYWUyYS00NDVjLWE1NzAtNzQyMzNiMTJkZjQyIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5vZWxpYXJvZHJpZ3VlenBlbHVAZ21haWwuY29tIiwicGhvbmUiOiIyOTE0NzE3MDM5IiwiY3VpbCI6IjIwMzIyNzI1MzQwIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkZhYmlhbiBCZWxkcmlvICIsImN1aWwiOiIyMDMyMjcyNTM0MCJ9XSwiaWF0IjoxNzU4MDM1ODQ4fQ.vmHBKr1FfU4PCRrPcbpXA_4PO-khRXPuDQmo_PSbD5c	\N	2025-09-16 15:17:28.15	2025-09-16 15:47:55.644	\N	20322725340	noeliarodriguezpelu@gmail.com	2914717039
0fd52337-3aa5-4bc8-bdda-48dc73396bf5	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMGZkNTIzMzctM2FhNS00YmM4LWJkZGEtNDhkYzczMzk2YmY1IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5vZWxpYXJvZHJpZ3VlenBlbHUzQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNDcxNzAzOSIsImN1aWwiOiIyNzUwODQwMDg1OSIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJOaWNvbGUgbHVkbWlsYSAgQmVsZHJpbyAiLCJjdWlsIjoiMjc1MDg0MDA4NTkifV0sImlhdCI6MTc1ODAzNjQyNX0.bz_zOxAFgLy8tqeEsc8goNU3zRTb0cjJipW3MIP7924	\N	2025-09-16 15:27:05.483	2025-09-16 15:47:42.951	\N	27508400859	noeliarodriguezpelu3@gmail.com	2914717039
fd6f44b1-a016-4e6b-b741-355edfc41f1a	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZmQ2ZjQ0YjEtYTAxNi00ZTZiLWI3NDEtMzU1ZWRmYzQxZjFhIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Imx1Y2lhY2FzdGFyZXNAZ21haWwuY29tIiwicGhvbmUiOiIyOTE1NzY0Mzk0IiwiY3VpbCI6IjI3MzQ2MDk1ODYwIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6Ikx1Y2FzIENhc3RhcmVzIiwiY3VpbCI6IjIwMzc1NTUzNDU4In1dLCJpYXQiOjE3NTgxNDAyNDl9.w5WmisVN7SksjP8QZ4cYrYWDqENt_-B6lUhMVZzwnFg	\N	2025-09-17 20:17:29.625	2025-09-17 20:19:17.234	\N	27346095860	luciacastares@gmail.com	2915764394
6d740945-2c87-4ebb-991e-6b548e61dfee	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNmQ3NDA5NDUtMmM4Ny00ZWJiLTk5MWUtNmI1NDhlNjFkZmVlIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTQ0NDMxMDkiLCJjdWlsIjoiNDUxODEyMSIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJFbHNhIHVib2xkaSIsImN1aWwiOiI0NTE4MTIxIn1dLCJpYXQiOjE3NTgxMDkwOTl9.vqjgHZJ249BWP0KOKcO3MF7PGWWelK0u8ZM_bXmCOCM	\N	2025-09-17 11:38:19.315	2025-09-17 11:38:30.998	\N	4518121	padillabrian830@gmail.com	2914443109
e65e175f-02a9-4fee-8ee2-d2f42f68be8e	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZTY1ZTE3NWYtMDJhOS00ZmVlLThlZTItZDJmNDJmNjhiZThlIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1hbGVuZXN0ZWxhZWxndWV0YUBnbWFpbC5jb20iLCJwaG9uZSI6IjAyOTE0NjQ5ODA4IiwiY3VpbCI6IjI3MzEzMjc1MzQwIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkR5bGFuIEV6ZXIgQ2FyYmFsbG8iLCJjdWlsIjoiMjA1MTU5MTE4NDgifV0sImlhdCI6MTc1ODEzMjU4Nn0.Usc7f-FeLxA-pxpTFwKroiBzIz03wZQ7tz7JcZq2KlE	\N	2025-09-17 18:09:46.33	2025-09-17 18:20:51.601	\N	27313275340	malenestelaelgueta@gmail.com	02914649808
8fd66d48-816b-40fe-8f15-2b79ab88b68d	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOGZkNjZkNDgtODE2Yi00MGZlLThmMTUtMmI3OWFiODhiNjhkIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1hdGVvcmlxdWVsbWUyMDA3QGdtYWlsLmNvbSIsInBob25lIjoiMjkxNDQ0MDY4OCIsImN1aWwiOiIyMDQ4NTAwNjc3MCIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJNYXRlbyBJdsOhbiBSaXF1ZWxtZSIsImN1aWwiOiIyMDQ4NTAwNjc3MCJ9XSwiaWF0IjoxNzU4MjExNTkzfQ.wE-ZPndKIYeVwHh856612PRmTvJcmpZnhnPL2REQq3Y	\N	2025-09-18 16:06:33.135	2025-09-18 16:15:33.682	\N	20485006770	mateoriquelme2007@gmail.com	2914440688
b9ddb67c-a934-4e78-88cc-9ae037a743b2	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	82000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYjlkZGI2N2MtYTkzNC00ZTc4LTg4Y2MtOWFlMDM3YTc0M2IyIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjQ2MjM5NGUzLTc5ZmMtNGY0Yi1iZTY4LTA0M2Y0ZDFhNmE4MiIsInF1YW50aXR5IjoxLCJlbWFpbCI6Imx1Y2lhY2FzdGFyZXNAZ21haWwuY29tIiwicGhvbmUiOiIyOTE1NzY0Mzk0IiwiY3VpbCI6IjI3MzQ2MDk1ODYwIiwidG90YWxBbW91bnQiOjgyMDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkFicmlsIEloaXR6IiwiY3VpbCI6IjI3NDgwMjEwOTE5In0seyJuYW1lIjoiQnJpc2EgSWhpdHoiLCJjdWlsIjoiMjc1MTQ1ODMzMjkifSx7Im5hbWUiOiJTb2ZpYSBBcmF2ZW5hIiwiY3VpbCI6IjI3NDcyODIyMjcxIn0seyJuYW1lIjoiQ2VsaW5lIEZ1aHIiLCJjdWlsIjoiMjc0NDAwNzQ4ODUifSx7Im5hbWUiOiJEeWxhbiBJaGl0eiIsImN1aWwiOiIyMDUxMTc5MzMzNiJ9XSwiaWF0IjoxNzU4MTM5MzkyfQ.MsXKQLkdb4yf_quy7q1I7BER8KS3A8YwT-lPaJ_AMZc	\N	2025-09-17 20:03:12.812	2025-09-17 20:14:43.473	\N	27346095860	luciacastares@gmail.com	2915764394
0bb3b3d5-ff72-4e2e-8a24-d7da79b8641b	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMGJiM2IzZDUtZmY3Mi00ZTJlLThhMjQtZDdkYTc5Yjg2NDFiIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1vcmVlc2FudGFuYTI2OEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUyNDU2MDIiLCJjdWlsIjoiMjc0ODEwNjY5ODYiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTW9yZW5hIEFpbGluIFNhbnRhbmEgIiwiY3VpbCI6IjI3NDgxMDY2OTg2In1dLCJpYXQiOjE3NTgxNjE3NDd9.5-svV94mdiTZG4y_IWy44wWshGBZ_uWlyXZSmAlz1wk	\N	2025-09-18 02:15:47.404	2025-09-18 02:43:20.942	\N	27481066986	moreesantana268@gmail.com	2915245602
8cf612ec-cf8e-4dea-9bc5-1b326dd19d84	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOGNmNjEyZWMtY2Y4ZS00ZGVhLTliYzUtMWIzMjZkZDE5ZDg0IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InNlcmdpb3JvdGgyNEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNjA3MzIiLCJjdWlsIjoiMjAzNTk4ODIzNzMiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTHVkbWlsYSBZYXptaW4gUm90aCIsImN1aWwiOiIyMDM1OTg4MjM3MyJ9XSwiaWF0IjoxNzU4MjE0NDE2fQ.m3QEGCZhDMZI6-TLKKR91Tyt63zxMou26TFtxhrctJY	\N	2025-09-18 16:53:36.046	2025-09-18 17:23:15.947	\N	20359882373	sergioroth24@gmail.com	2915360732
40302f89-61bd-43cc-8b33-7c15169db372	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNDAzMDJmODktNjFiZC00M2NjLThiMzMtN2MxNTE2OWRiMzcyIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6ImRhbG1pcm9ianNhZXpAZ21haWwuY29tIiwicGhvbmUiOiIyOTE0NDE0MjY1IiwiY3VpbCI6IjIwNDYzMzg1NTczIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IkRhbG1pcm8gTmFodWVsIFPDoWV6IiwiY3VpbCI6IjIwNDYzMzg1NTczIn1dLCJpYXQiOjE3NTgyMTk5MzZ9.a-UmkiBQHLBmiOSYC1sboaATCUXuso-2aQaZgQW3M20	\N	2025-09-18 18:25:36.469	2025-09-18 19:42:25.994	\N	20463385573	dalmirobjsaez@gmail.com	2914414265
362b77be-9452-43c4-a542-5e2676bee241	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	50000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMzYyYjc3YmUtOTQ1Mi00M2M0LWE1NDItNWUyNjc2YmVlMjQxIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6ImNmMTJmMzU4LWFiM2QtNDRlNC04MTJjLTc5NDhmZWJmMjg3NiIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTQiLCJ0b3RhbEFtb3VudCI6NTAwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWF4aSBpaGl0eiIsImN1aWwiOiIzOTg3NzQ4MSJ9LHsibmFtZSI6IklzYWkgcm9ibGVkbyIsImN1aWwiOiI0ODY4OTMwNCJ9LHsibmFtZSI6Ik1hcmNvcyBSaXZlcm8iLCJjdWlsIjoiNDgwOTI0MzkifV0sImlhdCI6MTc1ODI5NzA5N30.I6zDjBh7qVZrzbfkxEazS-4NcPKY4Nb5284Vh_ifUU8	\N	2025-09-19 15:51:37.159	2025-09-19 15:51:51.286	\N	20424395794	padillabrian830@gmail.com	2915350044
2d661736-31f2-4061-a6f4-194c3393cdc1	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMmQ2NjE3MzYtMzFmMi00MDYxLWE2ZjQtMTk0YzMzOTNjZGMxIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5vZWxpYXJvZHJpZ3VlenBlbHUzQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNDcxNzAzOSIsImN1aWwiOiIyMDM0MDIzNTAxNiIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJLYXJpbmEgTG9wZXogIiwiY3VpbCI6IjI3MzIyODgyMTg3In1dLCJpYXQiOjE3NTgyMzMzMTZ9.irUMOJIpE6PnBjwms-eWT1J9klnzNiuZYCx3wIqXIaY	\N	2025-09-18 22:08:36.379	2025-09-18 22:12:38.458	\N	20340235016	noeliarodriguezpelu3@gmail.com	2914717039
c1d8a6d2-86e3-42b4-bc53-0650fe7f1112	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYzFkOGE2ZDItODZlMy00MmI0LWJjNTMtMDY1MGZlN2YxMTEyIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5vZWxpYXJvZHJpZ3VlenBlbHUzQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNDcxNzAzOSIsImN1aWwiOiIyNzM0MDIzNTAxNiIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJHdWlkbyBwaW50b3MgIiwiY3VpbCI6IjIwNDExMzU0MDg0In1dLCJpYXQiOjE3NTgyMzMwNTJ9.uVrHimFajP6nCJHQRWZmXBP7X_nfUpbdosn7hzPeb5g	\N	2025-09-18 22:04:12.344	2025-09-18 22:12:46.842	\N	27340235016	noeliarodriguezpelu3@gmail.com	2914717039
c7e8c25a-8415-493d-a6c3-a40888096861	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	50000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYzdlOGMyNWEtODQxNS00OTNkLWE2YzMtYTQwODg4MDk2ODYxIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6ImNmMTJmMzU4LWFiM2QtNDRlNC04MTJjLTc5NDhmZWJmMjg3NiIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTQiLCJ0b3RhbEFtb3VudCI6NTAwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiU2ViYXN0aWFuIHNvcmlhIiwiY3VpbCI6IjMwMDYyMDU4In0seyJuYW1lIjoiVG9ybyBtYXRpYXMgIiwiY3VpbCI6IjQ2ODEzNTc1In0seyJuYW1lIjoianVhbiBnYWJyaWVsIHlsbGVzY2EiLCJjdWlsIjoiNDY2NDAwMDgifV0sImlhdCI6MTc1ODI5Njg5OX0.Zd4wg3BCuyIHPMhPBlUvxifIqyxvRO9Fno6bgEDoCuU	\N	2025-09-19 15:48:19.328	2025-09-19 15:49:01.889	\N	20424395794	padillabrian830@gmail.com	2915350044
fd54c0ee-0eaa-4455-9295-94aaae3bad20	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZmQ1NGMwZWUtMGVhYS00NDU1LTkyOTUtOTRhYWFlM2JhZDIwIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im5vZWxpYXJvZHJpZ3VlenBlbHUzMzNAZ21haWwuY29tIiwicGhvbmUiOiIyOTE0NzE3MDM5IiwiY3VpbCI6IjI3MzQwMjM1MDE2IiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6IldhbmRhICBsZXpjYW5vIiwiY3VpbCI6IjI3NTMwNjQ2MTc5In1dLCJpYXQiOjE3NTgyNTE0MDR9.XownI071zneaHbbqYfPCFLuwX9ItaPI8PbRnhWGEImE	\N	2025-09-19 03:10:04.575	2025-09-19 03:10:43.501	\N	27340235016	noeliarodriguezpelu333@gmail.com	2914717039
a3031c49-449f-46a6-82bc-02c02bcca443	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYTMwMzFjNDktNDQ5Zi00NmE2LTgyYmMtMDJjMDJiY2NhNDQzIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6ImJpYW5jYXBhaWxsYW4xQGdtYWlsLmNvbSIsInBob25lIjoiMjkxNTI0Nzc4MyIsImN1aWwiOiI0ODU4MTM4MiIsInRvdGFsQW1vdW50IjoxODAwMCwiY3VycmVuY3kiOiJBUlMiLCJhdHRlbmRlZXMiOlt7Im5hbWUiOiJDYW5kZWxhIEVsdW5leSBQYWlsbMOhbiAiLCJjdWlsIjoiNTA4ODk5OTMifV0sImlhdCI6MTc1ODI4NTU4Mn0.DPyk7e1DbLdQM2W7IcNdWJnTMAjHxRSSyCtlC0Op_CE	\N	2025-09-19 12:39:42.89	2025-09-19 12:40:08.303	\N	48581382	biancapaillan1@gmail.com	2915247783
c008e94b-545f-4276-aa12-ea18f51ec76d	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiYzAwOGU5NGItNTQ1Zi00Mjc2LWFhMTItZWExOGY1MWVjNzZkIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTQiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWFyaWEgQmVsZW4gQXJpYXMiLCJjdWlsIjoiNDYxMTQ1MTAifV0sImlhdCI6MTc1ODI5NzIxM30.E7FlOS4x5rSKLxJj7NI-Ztnt_K9l36DF8rqhtCPpA38	\N	2025-09-19 15:53:33.91	2025-09-19 15:53:48.918	\N	20424395794	padillabrian830@gmail.com	2915350044
0fd1cc40-58dd-456a-97ec-51dc30e5773d	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMGZkMWNjNDAtNThkZC00NTZhLTk3ZWMtNTFkYzMwZTU3NzNkIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTEiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiSmF6bWluIERlZGV1Z2QiLCJjdWlsIjoiNDk1MTc2NjQifV0sImlhdCI6MTc1ODI5OTkyNX0.j3NX6OsfSoJhayBa38LPYm_bD_JgpRY8mBdCvwmFaeg	\N	2025-09-19 16:38:45.787	2025-09-19 16:38:57.774	\N	20424395791	padillabrian830@gmail.com	2915350044
f7547704-d6f5-4beb-b745-8b3d92177e34	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZjc1NDc3MDQtZDZmNS00YmViLWI3NDUtOGIzZDkyMTc3ZTM0IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiNDI0Njk1NzkiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiQ2FtaWxhIE1hcmRvbmVzIiwiY3VpbCI6IjQ5OTMxNTk3In1dLCJpYXQiOjE3NTgzMDAwMjV9.hdKWZE8qTgUchCqwgkPpwKHl-OcG3utl974hnSf6Sek	\N	2025-09-19 16:40:25.149	2025-09-19 16:40:41.761	\N	42469579	padillabrian830@gmail.com	2915350044
831d6b77-f991-475d-9ce9-b6543880aee6	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiODMxZDZiNzctZjk5MS00NzVkLTljZTktYjY1NDM4ODBhZWU2IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjAyOTE1MzUwMDQ0IiwiY3VpbCI6IjIwNDI0Njk1NzkiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiYnJpYW4gZ2FicmllbCBwYWRpbGxhIiwiY3VpbCI6IjMzNzk5NjEwIn1dLCJpYXQiOjE3NTgzMDY4OTB9.Spih32l6E2zftDVMOfjLRHgMk8hbbmZt8NfQzdRf2dg	\N	2025-09-19 18:34:50.019	2025-09-19 18:35:42.94	\N	2042469579	padillabrian830@gmail.com	02915350044
572a5de8-a018-4b8a-aa2b-e22bdeac532b	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNTcyYTVkZTgtYTAxOC00YjhhLWFhMmItZTIyYmRlYWM1MzJiIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTQiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWlzYWVsIFJvYmxlZG8iLCJjdWlsIjoiNDU5NDMwOTkifV0sImlhdCI6MTc1ODMwMTcwN30.hJ2C5QFs9JIPvZoo5yqA9fhMporv7I9tz0DwJXYZ39U	\N	2025-09-19 17:08:27.251	2025-09-19 17:08:59.718	\N	20424395794	padillabrian830@gmail.com	2915350044
72b66672-b6e0-462e-be69-8aecb585631d	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiNzJiNjY2NzItYjZlMC00NjJlLWJlNjktOGFlY2I1ODU2MzFkIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTQiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiSm9zZWZpbmEgQmVsZHJpbyIsImN1aWwiOiI1MTA1MzI4NCJ9XSwiaWF0IjoxNzU4MzA1NTI0fQ.KAuhpWa7tUbd3U9hIVc7P_IUYgjWz-2Sq5o6sCcF8lc	\N	2025-09-19 18:12:04.151	2025-09-19 18:12:45.77	\N	20424395794	padillabrian830@gmail.com	2915350044
f2f3454c-8b13-4f8f-b74a-088a76f32426	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZjJmMzQ1NGMtOGIxMy00ZjhmLWI3NGEtMDg4YTc2ZjMyNDI2IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjAyOTE1MzUwMDQ0IiwiY3VpbCI6IjIwNDI0Njk1NzkiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTHVjaWEgUMOpcmV6IiwiY3VpbCI6IjQ4MTY1MTQ1In1dLCJpYXQiOjE3NTgzMDY0NDF9.gUsRGd8ZU5AqYI2Muvzn4NrR3lIxQif0O6dAZ9lynWs	\N	2025-09-19 18:27:21.34	2025-09-19 18:30:14.288	\N	2042469579	padillabrian830@gmail.com	02915350044
96fc1582-2cf4-4066-a6ac-0710c6cf42b7	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOTZmYzE1ODItMmNmNC00MDY2LWE2YWMtMDcxMGM2Y2Y0MmI3IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjAyOTE1MzUwMDQ0IiwiY3VpbCI6IjIwNDI0Njk1NzkiLCJ0b3RhbEFtb3VudCI6MTgwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTWFyY29zIFRvbGVkbyAiLCJjdWlsIjoiNDE1ODAyMzYifV0sImlhdCI6MTc1ODMxMzE4MH0.2EDqfzQhIDn2LUXc8WJedPXMjdcyn1gPzKou2-f6H9o	\N	2025-09-19 20:19:39.999	2025-09-19 20:19:59.336	\N	2042469579	padillabrian830@gmail.com	02915350044
2b4ae258-f7e1-4db7-814f-e79a168766fa	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	50000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiMmI0YWUyNTgtZjdlMS00ZGI3LTgxNGYtZTc5YTE2ODc2NmZhIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6ImNmMTJmMzU4LWFiM2QtNDRlNC04MTJjLTc5NDhmZWJmMjg3NiIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTQiLCJ0b3RhbEFtb3VudCI6NTAwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiUGlsIE1hcsOtYSAiLCJjdWlsIjoiMzIyNzE3NjkifSx7Im5hbWUiOiJUYXRpYW5hIGJlbGRyaW8iLCJjdWlsIjoiNTQyODk1NzMifSx7Im5hbWUiOiJJc2FiZWxhIEVzcGFyemEiLCJjdWlsIjoiNTQxMjgxOTMifV0sImlhdCI6MTc1ODM3MDU2Mn0.MwdBbx8ikksmj_dIGOJ_AF171zVIbWSzudndAku1ghs	\N	2025-09-20 12:16:02.116	2025-09-20 12:16:19.352	\N	20424395794	padillabrian830@gmail.com	2915350044
95c58377-51bf-4de1-b23d-cb9bccfe3ff4	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	18000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiOTVjNTgzNzctNTFiZi00ZGUxLWIyM2QtY2I5YmNjZmUzZmY0IiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6IjA2MjU3NGExLWQzMDAtNGM0My1iZTE1LTkxZDQ3Mjk1ZmZiZCIsInF1YW50aXR5IjoxLCJlbWFpbCI6Im1hdGVvYW5kcmVzLjMwMEBnbWFpbC5jb20iLCJwaG9uZSI6IjAyOTE1MDQzMzcwIiwiY3VpbCI6IjIwNDM1OTY2NDEyIiwidG90YWxBbW91bnQiOjE4MDAwLCJjdXJyZW5jeSI6IkFSUyIsImF0dGVuZGVlcyI6W3sibmFtZSI6Ik1hdGVvIE9jYW1wbyIsImN1aWwiOiIyMDQzNTk2NjQxMiJ9XSwiaWF0IjoxNzU4MzI1MDIyfQ.1alMEXDwFEYMQcbgsgkEoCtFZA-5evh4rFDhYhzUcc8	\N	2025-09-19 23:37:02.977	2025-09-20 16:54:45.646	\N	20435966412	mateoandres.300@gmail.com	02915043370
e9d137c5-9d58-4915-b7f7-000473487e52	2025	\N	2999d126-3ae3-4f6a-b074-8ea7a0b14076	50000	PAID	CASH	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmRlcklkIjoiZTlkMTM3YzUtOWQ1OC00OTE1LWI3ZjctMDAwNDczNDg3ZTUyIiwidXNlcklkIjpudWxsLCJldmVudElkIjoiMjk5OWQxMjYtM2FlMy00ZjZhLWIwNzQtOGVhN2EwYjE0MDc2IiwiY29tYm9JZCI6ImNmMTJmMzU4LWFiM2QtNDRlNC04MTJjLTc5NDhmZWJmMjg3NiIsInF1YW50aXR5IjoxLCJlbWFpbCI6InBhZGlsbGFicmlhbjgzMEBnbWFpbC5jb20iLCJwaG9uZSI6IjI5MTUzNTAwNDQiLCJjdWlsIjoiMjA0MjQzOTU3OTQiLCJ0b3RhbEFtb3VudCI6NTAwMDAsImN1cnJlbmN5IjoiQVJTIiwiYXR0ZW5kZWVzIjpbeyJuYW1lIjoiTmljb2zDoXMgYWRyb2JlICIsImN1aWwiOiIzOTk1Nzg0MSJ9LHsibmFtZSI6IkNhcm9saW5hIGJlbGVuIE1vbnRhw7FvIiwiY3VpbCI6IjM2NzU3NDg4In0seyJuYW1lIjoiTWVsb2R5IE1vbnRlbmVncm8iLCJjdWlsIjoiNTQyMjUzMTAifV0sImlhdCI6MTc1ODM3MDc3MX0.LhfPIbGvqE1HSthhu_mHa1PlzbsjoacE_tuylOqzBT8	\N	2025-09-20 12:19:31.98	2025-09-20 12:19:57.125	\N	20424395794	padillabrian830@gmail.com	2915350044
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."Payment" (id, year, "orderId", amount, type, "externalReference", "userId", "payerName", "payerEmail", "payerDni", "createdAt", "updatedAt", "deletedAt", "payerPhone") FROM stdin;
6bda8834-0886-4abf-a0d4-c35d10e01d25	2025	a3c9e3d0-29e6-4ff6-8d33-12d6a7bac0d3	18000	TRANSFER	a3c9e3d0-29e6-4ff6-8d33-12d6a7bac0d3	\N	\N	rociosoto03@hotmail.com	27325281087	2025-08-12 03:21:19.304	2025-08-12 03:21:19.304	\N	\N
bd24b0aa-cf4b-436b-b235-6df0f62ecaa8	2025	ad18b7f4-f5fb-4e04-9fd8-1d16e1b00903	18000	TRANSFER	ad18b7f4-f5fb-4e04-9fd8-1d16e1b00903	\N	\N	padillabrian830@gmail.com	31560532	2025-08-14 02:00:39	2025-08-14 02:00:39	\N	\N
e7e8012d-0f86-483d-a4ba-d7b8d79b8529	2025	7e82d91a-b880-4f0e-bd85-b52d498d7ff8	18000	TRANSFER	7e82d91a-b880-4f0e-bd85-b52d498d7ff8	\N	\N	padillabrian830@gmail.com	46561369	2025-08-14 02:20:04.921	2025-08-14 02:20:04.921	\N	\N
c8d8784f-c746-46d6-902d-9987c981c848	2025	9a955561-c2e6-45da-850e-bfdb5abb4ec8	18000	TRANSFER	9a955561-c2e6-45da-850e-bfdb5abb4ec8	\N	\N	padillabrian830@gmail.com	42810177	2025-08-14 02:20:12.421	2025-08-14 02:20:12.421	\N	\N
f0d5c3e9-3120-40f3-a5a6-689d7314bef8	2025	1df41bc3-d45c-438d-b5e5-b4132c785324	18000	TRANSFER	1df41bc3-d45c-438d-b5e5-b4132c785324	\N	\N	padillabrian830@gmail.com	10572069	2025-08-14 02:20:18.774	2025-08-14 02:20:18.774	\N	\N
2cc81b7a-2800-49ed-a852-8e9e2b2d85ec	2025	6d89f55c-1e27-4eb6-82f8-bb16504ddfaa	18000	TRANSFER	6d89f55c-1e27-4eb6-82f8-bb16504ddfaa	\N	\N	padillabrian830@gmail.com	44169504	2025-08-14 02:20:25.291	2025-08-14 02:20:25.291	\N	\N
e49f8ce7-242a-4be1-8597-e77c8b4e9b65	2025	c4ee85f4-1d83-4b91-8e9f-d2f01efcbe61	18000	TRANSFER	c4ee85f4-1d83-4b91-8e9f-d2f01efcbe61	\N	\N	padillabrian830@gmail.com	45782319	2025-08-14 02:20:31.578	2025-08-14 02:20:31.578	\N	\N
ea903f2f-dfb4-4752-9dc8-97a105f364e3	2025	775c12e9-1bad-4a36-908d-1479e7c36f79	18000	TRANSFER	775c12e9-1bad-4a36-908d-1479e7c36f79	\N	\N	padillabrian830@gmail.com	31994400	2025-08-14 02:20:37.088	2025-08-14 02:20:37.088	\N	\N
4bb68a64-028e-492b-8098-aa8417a0f010	2025	4397a7fe-fee9-4ff7-a52c-40c08cb75dd6	18000	TRANSFER	4397a7fe-fee9-4ff7-a52c-40c08cb75dd6	\N	\N	padillabrian830@gmail.com	46154272	2025-08-14 02:20:43.139	2025-08-14 02:20:43.139	\N	\N
bf1122bc-ba28-4257-a2fe-dc320efaad97	2025	d37094c0-8e12-48df-8635-e794b75a1ab5	18000	TRANSFER	d37094c0-8e12-48df-8635-e794b75a1ab5	\N	\N	padillabrian830@gmail.com	40944235	2025-08-14 02:20:49.442	2025-08-14 02:20:49.442	\N	\N
e1798394-adcd-444d-b01b-0f1879dcbdca	2025	c263ea6f-50c5-42ed-aa2a-8182d7af6f09	18000	TRANSFER	c263ea6f-50c5-42ed-aa2a-8182d7af6f09	\N	\N	padillabrian830@gmail.com	46827704	2025-08-19 12:36:57.827	2025-08-19 12:36:57.827	\N	\N
d720e6f4-79f3-4b3c-a947-e5b93f572b84	2025	e0685444-0a84-46b8-9498-2cd34ccdb19e	50000	TRANSFER	e0685444-0a84-46b8-9498-2cd34ccdb19e	\N	\N	padillabrian830@gmail.com	42195343	2025-08-19 12:40:24.975	2025-08-19 12:40:24.975	\N	\N
8b59dd93-2a4e-4450-9ab1-d5cda4d4091e	2025	9314f731-06c9-42cf-a985-9bd3f32ef736	18000	TRANSFER	9314f731-06c9-42cf-a985-9bd3f32ef736	\N	\N	padillabrian830@gmail.com	50148812	2025-08-19 12:40:33.268	2025-08-19 12:40:33.268	\N	\N
b3c2c07e-c40a-4475-8463-30f755c09ff8	2025	f052e834-c481-48cb-84c3-0480c91fa21a	18000	TRANSFER	f052e834-c481-48cb-84c3-0480c91fa21a	\N	\N	Facundorosales332@gmail.com	23420913559	2025-08-24 19:16:50.598	2025-08-24 19:16:50.598	\N	\N
7e2fa770-93be-48c4-a8d4-ed4be9891c57	2025	269f53f3-2c24-4e9a-88ce-546c7105ec58	108000	TRANSFER	269f53f3-2c24-4e9a-88ce-546c7105ec58	\N	\N	padillabrian830@gmail.com	2042469573	2025-08-25 13:36:26.146	2025-08-25 13:36:26.146	\N	\N
2723140f-610e-4eef-81c3-cfb362ec12c4	2025	5d001e99-643c-4267-b264-697ccbf4168c	18000	TRANSFER	5d001e99-643c-4267-b264-697ccbf4168c	\N	\N	Luciacastares@gmail.com	34609586	2025-08-27 13:13:27.836	2025-08-27 13:13:27.836	\N	\N
a69d1902-64ee-4990-9460-055fe509844c	2025	bef928ae-229a-414c-a48a-b3e1a9df341f	18000	TRANSFER	bef928ae-229a-414c-a48a-b3e1a9df341f	\N	\N	vmateovega08@gmail.com	48923353	2025-08-30 22:55:01.489	2025-08-30 22:55:01.489	\N	\N
f7be412f-6b3c-4f24-a6a7-800b321471d8	2025	5010fa60-0ac8-4ecd-9afa-7f0ef120ea85	18000	TRANSFER	5010fa60-0ac8-4ecd-9afa-7f0ef120ea85	\N	\N	marielamartino41@hotmail.com	27300621827	2025-09-02 01:04:48.645	2025-09-02 01:04:48.645	\N	\N
deb402a7-de9f-444d-b52b-7c8c3a58008c	2025	e5efab34-9e4e-4209-8452-220d45fa555c	18000	TRANSFER	e5efab34-9e4e-4209-8452-220d45fa555c	\N	\N	padillabrian830@gmail.com	48994490	2025-09-02 14:15:38.597	2025-09-02 14:15:38.597	\N	\N
72a03507-451d-48d6-ac2e-d33fa374d500	2025	aa30641d-c591-4ac8-8716-f25f469cc5cc	18000	TRANSFER	aa30641d-c591-4ac8-8716-f25f469cc5cc	\N	\N	padillabrian830@gmail.com	53304117	2025-09-02 14:16:01.444	2025-09-02 14:16:01.444	\N	\N
0c07840b-8a7a-44dc-af18-8cc2d821b3c9	2025	98b6448a-b035-46aa-9f40-ff51fc655f17	18000	TRANSFER	98b6448a-b035-46aa-9f40-ff51fc655f17	\N	\N	majogranada@gmail.com	27288233905	2025-09-02 15:39:34.471	2025-09-02 15:39:34.471	\N	\N
809fcfed-2e80-4116-9fe3-31dc3625101e	2025	ab71bba6-d187-4992-88a1-3eea683bceb5	18000	TRANSFER	ab71bba6-d187-4992-88a1-3eea683bceb5	\N	\N	maribelarellanouni@gmail.com	27436701603	2025-09-03 10:36:27.18	2025-09-03 10:36:27.18	\N	\N
b2dddc0f-f9a1-4b1a-80eb-c89428fc8ac6	2025	125d1f65-8371-4384-940e-2ebee2ddbca8	50000	TRANSFER	125d1f65-8371-4384-940e-2ebee2ddbca8	\N	\N	noeliarodriguezpelu.999@gmail.com	2734023501	2025-09-03 15:53:22.9	2025-09-03 15:53:22.9	\N	\N
13ddbf25-a18d-4f46-97a2-79e85c660d51	2025	01db1715-d4e4-4803-86aa-c29a8c7beafb	18000	TRANSFER	01db1715-d4e4-4803-86aa-c29a8c7beafb	\N	\N	rominarosales542@gmail.com	20431858717	2025-09-04 00:10:39.39	2025-09-04 00:10:39.39	\N	\N
e74499a0-35e5-45e5-a260-dd13947da340	2025	8a246caf-9ec7-4bb0-a474-2f12fa31864d	18000	TRANSFER	8a246caf-9ec7-4bb0-a474-2f12fa31864d	\N	\N	danielabparedes@hotmail.com	42836442	2025-09-05 01:49:07.828	2025-09-05 01:49:07.828	\N	2915119962
b02a6678-d8be-4d0b-aa90-8a558b1fe6cd	2025	2040f298-1146-4287-8c8e-96b3a95d87e8	18000	TRANSFER	2040f298-1146-4287-8c8e-96b3a95d87e8	\N	\N	valentinotoneguzzo@gmail.com	20470296993	2025-09-07 12:57:46.803	2025-09-07 12:57:46.803	\N	92494550435
e7193380-9747-42c3-9b7b-7e9366ec6257	2025	318697ff-cf59-4d6b-ac86-678d652eaa7b	18000	TRANSFER	318697ff-cf59-4d6b-ac86-678d652eaa7b	\N	\N	parramelany78@gmail.com	27436421287	2025-09-07 20:09:10.606	2025-09-08 12:04:03.779	\N	2915660671
dfbcff7a-c864-4b35-ba1f-bfa40466faa1	2025	5183358f-942b-4aae-a96b-12d44b868a2f	18000	TRANSFER	5183358f-942b-4aae-a96b-12d44b868a2f	\N	\N	jesigaliano@gmail.com	29038855	2025-09-10 18:34:16.13	2025-09-10 18:34:16.13	\N	2915715657
064b3ed6-176e-4d2e-80f6-f67db9270c75	2025	2690b815-8432-40b1-a938-c05907b9b482	18000	TRANSFER	2690b815-8432-40b1-a938-c05907b9b482	\N	\N	padillabrian830@gmail.com	45314400	2025-09-08 12:01:08.176	2025-09-08 12:05:59.608	\N	45314400
cb1e6f03-859e-4bce-a526-1005b63a31ae	2025	521b8b83-4b30-44c5-b712-c4ba44c378b2	18000	TRANSFER	521b8b83-4b30-44c5-b712-c4ba44c378b2	\N	\N	padillabrian830@gmail.com	41232334	2025-09-08 12:00:52.54	2025-09-08 12:06:33.279	\N	41232334
a86238d2-f108-4475-8888-59bf42ddb594	2025	1c71bd79-5ee0-408e-aa1a-608449b35ee0	18000	TRANSFER	1c71bd79-5ee0-408e-aa1a-608449b35ee0	\N	\N	nadiaanabelv@gmail.com	27322536068	2025-09-08 21:39:15.652	2025-09-08 21:39:15.652	\N	2914359280
f2dbdcbe-fa40-4bba-8c2e-5c4a92cb721a	2025	9612b10b-ac50-4851-8356-694b5cc68bbd	18000	TRANSFER	9612b10b-ac50-4851-8356-694b5cc68bbd	\N	\N	lujsam14@gmail.com	46534858	2025-09-10 18:34:04.476	2025-09-10 18:34:04.476	\N	2914638191
8afc8b36-dbda-43b1-86f8-15dac06260ec	2025	62b11c0e-ffc6-44e3-8a16-9b6ffc1821d8	18000	TRANSFER	62b11c0e-ffc6-44e3-8a16-9b6ffc1821d8	\N	\N	rsebapon@gmail.com	31371188	2025-09-10 18:34:25.54	2025-09-10 18:34:25.54	\N	2914757434
2df59570-6a80-4204-b8f4-245c38012d9f	2025	2c9431cb-38ec-4f3d-8593-573bb910d153	18000	TRANSFER	2c9431cb-38ec-4f3d-8593-573bb910d153	\N	\N	nazareno18mare@gmail.com	20471094154	2025-09-10 19:31:54.656	2025-09-10 19:31:54.656	\N	2914461836
d3bcff66-26e6-4294-9091-16f9c815123f	2025	9c7e5886-83f4-4dc4-adec-af58c9095e25	18000	TRANSFER	9c7e5886-83f4-4dc4-adec-af58c9095e25	\N	\N	berenicejacquez66@gmail.com	27460942328	2025-09-12 10:33:01.779	2025-09-12 10:33:01.779	\N	2916494605
3245b0c2-5267-44ea-8d88-55c060562825	2025	de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	82000	TRANSFER	de9fd08b-f752-4b4b-b6d8-36fdbe5d54f5	\N	\N	padillabrian830@gmail.com	42469579	2025-09-12 13:37:08.373	2025-09-12 13:37:08.373	\N	02915350044
890a12c0-4109-438d-a963-98f47d592c06	2025	8a4ed112-e7e1-4e44-b10a-baec620db2f9	18000	TRANSFER	8a4ed112-e7e1-4e44-b10a-baec620db2f9	\N	\N	balderramaanzaldojhonatan@gmail.com	94906121	2025-09-14 23:06:32.185	2025-09-14 23:06:32.185	\N	2914067634
155d3b9e-b538-4da6-b190-3ca3eef12633	2025	2840a13b-3a77-45c0-b015-3f9122efe211	18000	TRANSFER	2840a13b-3a77-45c0-b015-3f9122efe211	\N	\N	biancapaillan1@gmail.com	48581382	2025-09-15 01:35:10.364	2025-09-15 01:35:10.364	\N	2915247783
ebc4fc79-4a9b-40af-9c23-ce7a3134d073	2025	fcc068fb-31c5-402b-b35e-97eca376b22c	18000	CASH	fcc068fb-31c5-402b-b35e-97eca376b22c	\N	\N	melany.ailen.marillan@gmail.com	44169521	2025-09-15 01:37:37.228	2025-09-15 01:38:03.588	\N	2915350033
50c492dc-d293-4692-9f2f-b0d5c7c161bf	2025	0fd52337-3aa5-4bc8-bdda-48dc73396bf5	18000	TRANSFER	0fd52337-3aa5-4bc8-bdda-48dc73396bf5	\N	\N	noeliarodriguezpelu3@gmail.com	27508400859	2025-09-16 15:47:42.954	2025-09-16 15:47:42.954	\N	2914717039
d0d0cc9b-a365-4565-a569-9cd72572a27f	2025	ca489adf-ae2a-445c-a570-74233b12df42	18000	TRANSFER	ca489adf-ae2a-445c-a570-74233b12df42	\N	\N	noeliarodriguezpelu@gmail.com	20322725340	2025-09-16 15:47:55.646	2025-09-16 15:47:55.646	\N	2914717039
b376ec44-52ef-4bc8-aaa6-47c1299f6e3e	2025	33ba851d-ba10-4abd-80aa-dbecb27b1fef	65000	TRANSFER	33ba851d-ba10-4abd-80aa-dbecb27b1fef	\N	\N	estradayamila25@outlook.com	27349451862	2025-09-16 15:54:30.773	2025-09-16 15:54:30.773	\N	2916468824
c39aaae6-9f73-4137-9340-3517b4da675f	2025	6d740945-2c87-4ebb-991e-6b548e61dfee	18000	CASH	6d740945-2c87-4ebb-991e-6b548e61dfee	\N	\N	padillabrian830@gmail.com	4518121	2025-09-17 11:38:31.002	2025-09-17 11:38:50.38	\N	2914443109
981f3c07-3118-431b-a1a0-b37af91b0dbb	2025	e65e175f-02a9-4fee-8ee2-d2f42f68be8e	18000	TRANSFER	e65e175f-02a9-4fee-8ee2-d2f42f68be8e	\N	\N	malenestelaelgueta@gmail.com	27313275340	2025-09-17 18:20:51.603	2025-09-17 18:20:51.603	\N	02914649808
6678357a-116f-495c-b35c-3221d3b8db2d	2025	b9ddb67c-a934-4e78-88cc-9ae037a743b2	82000	TRANSFER	b9ddb67c-a934-4e78-88cc-9ae037a743b2	\N	\N	luciacastares@gmail.com	27346095860	2025-09-17 20:14:43.477	2025-09-17 20:14:43.477	\N	2915764394
24d5f2ff-b0b4-4922-a8e8-d93c1246da40	2025	fd6f44b1-a016-4e6b-b741-355edfc41f1a	18000	TRANSFER	fd6f44b1-a016-4e6b-b741-355edfc41f1a	\N	\N	luciacastares@gmail.com	27346095860	2025-09-17 20:19:17.237	2025-09-17 20:19:17.237	\N	2915764394
f54b10d5-4ca3-4766-8027-8f4507417a78	2025	0bb3b3d5-ff72-4e2e-8a24-d7da79b8641b	18000	TRANSFER	0bb3b3d5-ff72-4e2e-8a24-d7da79b8641b	\N	\N	moreesantana268@gmail.com	27481066986	2025-09-18 02:43:20.945	2025-09-18 02:43:20.945	\N	2915245602
67e434be-aef7-4597-8a30-c750d615b677	2025	8fd66d48-816b-40fe-8f15-2b79ab88b68d	18000	TRANSFER	8fd66d48-816b-40fe-8f15-2b79ab88b68d	\N	\N	mateoriquelme2007@gmail.com	20485006770	2025-09-18 16:15:33.687	2025-09-18 16:15:33.687	\N	2914440688
b7e9c479-e3fd-490e-bd06-866833a86ba8	2025	8cf612ec-cf8e-4dea-9bc5-1b326dd19d84	18000	TRANSFER	8cf612ec-cf8e-4dea-9bc5-1b326dd19d84	\N	\N	sergioroth24@gmail.com	20359882373	2025-09-18 17:23:15.95	2025-09-18 17:23:15.95	\N	2915360732
8364dc53-fbb2-4133-91e7-9fe5e6840508	2025	40302f89-61bd-43cc-8b33-7c15169db372	18000	TRANSFER	40302f89-61bd-43cc-8b33-7c15169db372	\N	\N	dalmirobjsaez@gmail.com	20463385573	2025-09-18 19:42:25.997	2025-09-18 19:42:25.997	\N	2914414265
9e55f65d-7efb-4d03-b871-d1ee92b8d0a7	2025	2d661736-31f2-4061-a6f4-194c3393cdc1	18000	TRANSFER	2d661736-31f2-4061-a6f4-194c3393cdc1	\N	\N	noeliarodriguezpelu3@gmail.com	20340235016	2025-09-18 22:12:38.461	2025-09-18 22:12:38.461	\N	2914717039
8aa229a0-afb0-414a-af36-c8ab45f19f44	2025	c1d8a6d2-86e3-42b4-bc53-0650fe7f1112	18000	TRANSFER	c1d8a6d2-86e3-42b4-bc53-0650fe7f1112	\N	\N	noeliarodriguezpelu3@gmail.com	27340235016	2025-09-18 22:12:46.844	2025-09-18 22:12:46.844	\N	2914717039
4e48f99b-524f-4e3d-9218-af262534a979	2025	fd54c0ee-0eaa-4455-9295-94aaae3bad20	18000	TRANSFER	fd54c0ee-0eaa-4455-9295-94aaae3bad20	\N	\N	noeliarodriguezpelu333@gmail.com	27340235016	2025-09-19 03:10:43.505	2025-09-19 03:10:43.505	\N	2914717039
ea628d57-624f-4a65-9871-33615a4a4f25	2025	a3031c49-449f-46a6-82bc-02c02bcca443	18000	TRANSFER	a3031c49-449f-46a6-82bc-02c02bcca443	\N	\N	biancapaillan1@gmail.com	48581382	2025-09-19 12:40:08.306	2025-09-19 12:40:08.306	\N	2915247783
d642fe5a-d37e-43fc-b30e-ab0937309738	2025	c7e8c25a-8415-493d-a6c3-a40888096861	50000	TRANSFER	c7e8c25a-8415-493d-a6c3-a40888096861	\N	\N	padillabrian830@gmail.com	20424395794	2025-09-19 15:49:01.892	2025-09-19 15:49:01.892	\N	2915350044
6061154d-cbad-4f61-aedc-3da64818d21b	2025	362b77be-9452-43c4-a542-5e2676bee241	50000	TRANSFER	362b77be-9452-43c4-a542-5e2676bee241	\N	\N	padillabrian830@gmail.com	20424395794	2025-09-19 15:51:51.289	2025-09-19 15:51:51.289	\N	2915350044
9e3f6e92-02da-4367-bdbf-1ca0f8917668	2025	c008e94b-545f-4276-aa12-ea18f51ec76d	18000	TRANSFER	c008e94b-545f-4276-aa12-ea18f51ec76d	\N	\N	padillabrian830@gmail.com	20424395794	2025-09-19 15:53:48.924	2025-09-19 15:53:48.924	\N	2915350044
3e7b0885-2c51-4a19-80be-81c24cae1a19	2025	0fd1cc40-58dd-456a-97ec-51dc30e5773d	18000	TRANSFER	0fd1cc40-58dd-456a-97ec-51dc30e5773d	\N	\N	padillabrian830@gmail.com	20424395791	2025-09-19 16:38:57.777	2025-09-19 16:38:57.777	\N	2915350044
6bce9e2b-1b7a-4dff-8454-4b07d77e8127	2025	f7547704-d6f5-4beb-b745-8b3d92177e34	18000	TRANSFER	f7547704-d6f5-4beb-b745-8b3d92177e34	\N	\N	padillabrian830@gmail.com	42469579	2025-09-19 16:40:41.763	2025-09-19 16:40:41.763	\N	2915350044
aa0ab06c-6092-4715-9abc-a36722951afe	2025	572a5de8-a018-4b8a-aa2b-e22bdeac532b	18000	TRANSFER	572a5de8-a018-4b8a-aa2b-e22bdeac532b	\N	\N	padillabrian830@gmail.com	20424395794	2025-09-19 17:08:59.721	2025-09-19 17:08:59.721	\N	2915350044
dc09ae9b-6e06-4038-ac8e-19be99ddcd0b	2025	72b66672-b6e0-462e-be69-8aecb585631d	18000	TRANSFER	72b66672-b6e0-462e-be69-8aecb585631d	\N	\N	padillabrian830@gmail.com	20424395794	2025-09-19 18:12:45.773	2025-09-19 18:12:45.773	\N	2915350044
c6cfdefe-8ba9-4908-8f49-5da99a7bfee9	2025	f2f3454c-8b13-4f8f-b74a-088a76f32426	18000	TRANSFER	f2f3454c-8b13-4f8f-b74a-088a76f32426	\N	\N	padillabrian830@gmail.com	2042469579	2025-09-19 18:30:14.291	2025-09-19 18:30:14.291	\N	02915350044
03ba925b-0d31-4685-84ff-17ab6342dc6c	2025	831d6b77-f991-475d-9ce9-b6543880aee6	18000	TRANSFER	831d6b77-f991-475d-9ce9-b6543880aee6	\N	\N	padillabrian830@gmail.com	2042469579	2025-09-19 18:35:42.943	2025-09-19 18:35:42.943	\N	02915350044
7009a05e-5e8b-43cf-8da1-3a1a7a21cbc1	2025	96fc1582-2cf4-4066-a6ac-0710c6cf42b7	18000	TRANSFER	96fc1582-2cf4-4066-a6ac-0710c6cf42b7	\N	\N	padillabrian830@gmail.com	2042469579	2025-09-19 20:19:59.338	2025-09-19 20:19:59.338	\N	02915350044
b2a72db3-125c-41cb-9b8b-aa4f2f0f05b5	2025	2b4ae258-f7e1-4db7-814f-e79a168766fa	50000	TRANSFER	2b4ae258-f7e1-4db7-814f-e79a168766fa	\N	\N	padillabrian830@gmail.com	20424395794	2025-09-20 12:16:19.355	2025-09-20 12:16:19.355	\N	2915350044
358f1a7a-0b1b-4f9e-a0bf-7f7775e8c8b4	2025	e9d137c5-9d58-4915-b7f7-000473487e52	50000	TRANSFER	e9d137c5-9d58-4915-b7f7-000473487e52	\N	\N	padillabrian830@gmail.com	20424395794	2025-09-20 12:19:57.127	2025-09-20 12:19:57.127	\N	2915350044
1d9dfae2-aa4f-4b2c-b753-2ad8cf0c5afc	2025	95c58377-51bf-4de1-b23d-cb9bccfe3ff4	18000	TRANSFER	95c58377-51bf-4de1-b23d-cb9bccfe3ff4	\N	\N	mateoandres.300@gmail.com	20435966412	2025-09-20 16:54:45.649	2025-09-20 16:54:45.649	\N	02915043370
\.


--
-- Data for Name: PreSale; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."PreSale" (id, "eventId", "discountPercent", "startDate", "ticketQuantity", year, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."User" (id, "auth0Id", provider, dni, name, "givenName", "familyName", nickname, email, "emailVerified", picture, locale, password, role, "createdAt", "updatedAt", "lastLogin", "deletedAt") FROM stdin;
7a3b553b-a034-442f-bcdd-e9b3c6e65e90	\N	LOCAL	00000001	Brisa	Brisa	Gabella	\N	brisgabella@gmail.com	f	https://example.com/brisa.jpg	es-AR	$2b$10$wYF.etyJtJB18nihv6Csq.L78H8ySMpp1wQVKrhJ5cpmoDcOGynt6	ADMIN	2025-07-01 04:50:39.548	2025-07-01 04:50:39.548	\N	\N
9ce2b726-09fe-41ff-a96f-581e47b4dc83	\N	LOCAL	00000002	Estefania	Estefania	Vazquez	\N	estefaniavicvazquez@hotmail.com	f	https://example.com/estefania.jpg	es-AR	$2b$10$1sVU9Tu8PBdStPcUokgnpewf0FSWo0tChTIXbbTYfrKTz501RN2Ei	ADMIN	2025-07-01 04:50:39.7	2025-07-01 04:50:39.7	\N	\N
b48c10a6-63df-457f-83af-1cb0d5cd71dd	\N	LOCAL	42469579	brian	brian	padilla	\N	padillabrian830@gmail.com	f	https://example.com/brisa.jpg	es-AR	$2b$10$qSDApxPyZzrFGbKX5u9zKuPSy8WDpHaK2rIw7A.ER00R1fAijGJrW	DEVELOPER	2025-07-01 04:50:39.295	2025-09-15 03:08:20.949	\N	\N
450b5f97-1a9a-40b4-b87e-f086c0b92010	\N	LOCAL	94899585	norma jordan	\N	\N	\N	jordannorma01@gmail.com	f	\N	\N	$2b$10$NE8Yrcg7BHnvj/axsQxxqOE33AR182aFTZXq90VBGJia2p9FgfpLu	COLLABORATOR	2025-09-15 02:37:06.89	2025-09-15 03:09:55.68	\N	\N
b3e55322-e207-4139-99e8-ef2083fef318	\N	LOCAL	1651564	fsdfsd	\N	\N	\N	padillasdfsdbrian830@gmail.com	f	\N	\N	$2b$10$x9AHjaJQ75RiNYktQIS5UuPCOSbUd9xU.PJnBC315r04P96P6I4w2	COLLABORATOR	2025-09-15 11:22:27.534	2025-09-15 11:22:33.849	\N	2025-09-15 11:22:33.848
283479d6-eced-4066-8746-722372f95225	\N	LOCAL	00000000	kevin	\N	\N	\N	kv9314489@gmail.com	f	\N	\N	$2b$10$NqTbHf.ZF6/9wXNublwlfuA6vMHS13pPz9VYAqlgucbPFO2GwWdN.	COLLABORATOR	2025-09-15 13:19:58.282	2025-09-15 13:19:58.282	\N	\N
9837d990-caa4-4e2d-9298-eacd64d9be81	\N	LOCAL	00000011	tom	\N	\N	\N	alcoholadotomas@gmail.com	f	\N	\N	$2b$10$siKHt2d0xkuDyFytLEUWNO6jPOZ9RdG.ry9OX/SGhIBGsRC1qG/1O	COLLABORATOR	2025-09-15 13:41:41.465	2025-09-15 13:41:41.465	\N	\N
d4767737-7009-49fb-be76-5707f4bbc155	\N	LOCAL	12439464	Santino	\N	\N	\N	vasquezsantino781@gmail.com	f	\N	\N	$2b$10$Ps2f8KdqdCHExBTCcX1EDONtH1Pv.cquji49rkb3U1zYqf6N1Es5O	COLLABORATOR	2025-09-19 10:50:16.376	2025-09-19 10:50:16.376	\N	\N
\.


--
-- Data for Name: _ComboToOrder; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public."_ComboToOrder" ("A", "B") FROM stdin;
062574a1-d300-4c43-be15-91d47295ffbd	a3c9e3d0-29e6-4ff6-8d33-12d6a7bac0d3
062574a1-d300-4c43-be15-91d47295ffbd	f052e834-c481-48cb-84c3-0480c91fa21a
062574a1-d300-4c43-be15-91d47295ffbd	ea780860-a31a-4195-985c-73fe952a967c
062574a1-d300-4c43-be15-91d47295ffbd	d143bd1d-957a-4e30-bbe8-5c3905a39f0d
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: brian
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b7b5705c-1136-434c-a87b-3d0740236e21	e483450c8339af3a8cc3bdeda5f03d4a3df4b1cf74b82e41793a4454d36480d0	2025-06-29 21:23:55.17329-03	20250625104208_init	\N	\N	2025-06-29 21:23:54.252609-03	1
f2716b4a-5468-467e-915b-74054a83c7d6	a2dcf435e6d5c765f783a0af26d90f60a8d9569c36fb5eff78a1ce75b7db8cfa	2025-06-29 21:23:55.247347-03	20250626235945_add_email_cuil_to_order	\N	\N	2025-06-29 21:23:55.190388-03	1
e6ad9c30-35e7-4e39-9a7d-3f3612b07066	dd596bf19ca67b416187873221f04c9789aa321903b96869c5b24d8db672b42e	2025-08-12 00:09:50.136013-03	20250810234818_add_cash_payment_type	\N	\N	2025-08-12 00:09:50.022017-03	1
99f1cee2-de99-493f-95a7-fb4a539184b2	6abc05829f81640d1fe7933e5f7168accb91946bc08283fe3ba9d2ad3b910289	2025-08-18 23:30:15.526957-03	20250819010906_add_email_phone_to_invitee	\N	\N	2025-08-18 23:30:15.340586-03	1
330f2e73-a30b-4228-af03-bacadb23f6b2	4eac6ee97b11d390d9ac9aa84b4a2e3f85788605d04efbf02b99a8b62ba76c1e	2025-08-19 20:46:56.221117-03	20250819231355_add_finanzas_models	\N	\N	2025-08-19 20:46:55.035409-03	1
95b6c205-7f48-4d34-aa87-70df6762a317	1fc26f2d2f52ad2e33aed3d4828e00cea3058ca99cb86547839a269fdef3b8ca	2025-09-03 18:59:05.228925-03	20250903211549_add_payer_phone	\N	\N	2025-09-03 18:59:04.989743-03	1
c406ff2f-02f1-44f2-a598-b4c3b62613a4	1139b748f6b6018d9397b3a59b2b4a738174cf880cf7cf5ac8c56a56af9a0d4d	2025-09-03 18:59:05.486333-03	20250903214832_add_phone_to_orders	\N	\N	2025-09-03 18:59:05.282665-03	1
\.


--
-- Name: Combo Combo_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Combo"
    ADD CONSTRAINT "Combo_pkey" PRIMARY KEY (id);


--
-- Name: Egreso Egreso_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Egreso"
    ADD CONSTRAINT "Egreso_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Ingreso Ingreso_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Ingreso"
    ADD CONSTRAINT "Ingreso_pkey" PRIMARY KEY (id);


--
-- Name: Invitee Invitee_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Invitee"
    ADD CONSTRAINT "Invitee_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PreSale PreSale_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."PreSale"
    ADD CONSTRAINT "PreSale_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _ComboToOrder _ComboToOrder_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."_ComboToOrder"
    ADD CONSTRAINT "_ComboToOrder_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Combo_name_year_key; Type: INDEX; Schema: public; Owner: brian
--

CREATE UNIQUE INDEX "Combo_name_year_key" ON public."Combo" USING btree (name, year);


--
-- Name: Order_externalReference_key; Type: INDEX; Schema: public; Owner: brian
--

CREATE UNIQUE INDEX "Order_externalReference_key" ON public."Order" USING btree ("externalReference");


--
-- Name: User_auth0Id_key; Type: INDEX; Schema: public; Owner: brian
--

CREATE UNIQUE INDEX "User_auth0Id_key" ON public."User" USING btree ("auth0Id");


--
-- Name: User_dni_key; Type: INDEX; Schema: public; Owner: brian
--

CREATE UNIQUE INDEX "User_dni_key" ON public."User" USING btree (dni);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: brian
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _ComboToOrder_B_index; Type: INDEX; Schema: public; Owner: brian
--

CREATE INDEX "_ComboToOrder_B_index" ON public."_ComboToOrder" USING btree ("B");


--
-- Name: Combo Combo_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Combo"
    ADD CONSTRAINT "Combo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invitee Invitee_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Invitee"
    ADD CONSTRAINT "Invitee_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invitee Invitee_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Invitee"
    ADD CONSTRAINT "Invitee_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PreSale PreSale_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."PreSale"
    ADD CONSTRAINT "PreSale_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _ComboToOrder _ComboToOrder_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."_ComboToOrder"
    ADD CONSTRAINT "_ComboToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES public."Combo"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ComboToOrder _ComboToOrder_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brian
--

ALTER TABLE ONLY public."_ComboToOrder"
    ADD CONSTRAINT "_ComboToOrder_B_fkey" FOREIGN KEY ("B") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict U426GbmLvZqOMQCHnX7iflOlPhmiiU5g6zxUcfcSmGG8S5vyiogufD9nCWac5pI


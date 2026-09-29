--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer,
    user_username character varying,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faqs (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'::text),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.faqs OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faqs_id_seq OWNER TO postgres;

--
-- Name: faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faqs_id_seq OWNED BY public.faqs.id;


--
-- Name: mountains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mountains (
    id integer NOT NULL,
    name text,
    location text,
    description text,
    photo_url text,
    continent character varying(15),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.mountains OWNER TO postgres;

--
-- Name: mountains_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mountains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mountains_id_seq OWNER TO postgres;

--
-- Name: mountains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mountains_id_seq OWNED BY public.mountains.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    mountain_id integer,
    user_username character varying,
    title text,
    content text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    mountain_id integer,
    username character varying,
    rating integer,
    comment text,
    is_flagged boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_rating CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favorites (
    id integer NOT NULL,
    user_username character varying(50) NOT NULL,
    mountain_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_favorites OWNER TO postgres;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_favorites_id_seq OWNER TO postgres;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_favorites_id_seq OWNED BY public.user_favorites.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    username character varying(50) NOT NULL,
    user_password character varying(255),
    user_role character varying(20),
    email character varying(255),
    first_name character varying(50) DEFAULT ''::character varying NOT NULL,
    last_name character varying(50) DEFAULT ''::character varying NOT NULL,
    bio text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    avatar_url character varying(255),
    avatar_path character varying(255),
    avatar_hash character varying(64),
    CONSTRAINT check_email CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$'::text))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: faqs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs ALTER COLUMN id SET DEFAULT nextval('public.faqs_id_seq'::regclass);


--
-- Name: mountains id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mountains ALTER COLUMN id SET DEFAULT nextval('public.mountains_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: user_favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites ALTER COLUMN id SET DEFAULT nextval('public.user_favorites_id_seq'::regclass);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, post_id, user_username, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: faqs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faqs (id, name, email, subject, message, created_at, updated_at) FROM stdin;
1	John Doe	john@example.com	Subject 1	Message 1	2024-05-24 21:49:00.534309	2024-07-12 10:02:46.975726-07
2	Jane Doe	jane@example.com	Subject 2	Message 2	2024-05-24 21:49:00.534309	2024-07-12 10:02:46.975726-07
3	Check	Messi@gmail.com	Testing	Testing123	2024-05-24 22:18:49.35635	2024-07-12 10:02:46.975726-07
4	Hung	ngomanhhung40@gmail.com	Messi And Ronaldo	Who is better ?	2024-10-07 23:14:04.546701	2024-10-07 09:14:04.546701-07
5	Hung	hung.nm226083@sis.hust.edu.vn	Who are you	Messi or Ronaldo	2024-10-07 23:16:12.958685	2024-10-07 09:16:12.958685-07
6	Hanoi	hanoi@gmail.com	Are you there 	Miss me yet	2024-10-25 22:43:52.755617	2024-10-25 08:43:52.755617-07
7	HIto	enomi@gmail.com	message Check	Fox tje loey sceee	2024-10-31 19:59:35.738868	2024-10-31 05:59:35.738868-07
8	IDK	idk@gmail.com	ON fixing the problems	The web is bad as fuck 	2025-02-12 11:09:33.08597	2025-02-11 20:09:33.08597-08
9	Idk helppppp	hello@gmail.com	Messi Ronaldo 	Kaka dembele	2025-02-11 20:20:57.477943	2025-02-11 20:20:57.477943-08
10	HanhpHuc	hp@gmail..com	12304	You oaoaoaoao	2025-02-11 20:15:57.199277	2025-02-11 21:15:57.199277-08
11	noem	1@gmail.com	mo111	mvsoavmas	2025-02-11 20:16:40.848203	2025-02-11 21:16:40.848203-08
\.


--
-- Data for Name: mountains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mountains (id, name, location, description, photo_url, continent, created_at, updated_at) FROM stdin;
1	Zermatt	Switzerland	A picturesque town at the base of the Matterhorn.	mountain_town_1.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
2	Banff	Canada	A charming town within Banff National Park.	mountain_town_2.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
3	Chamonix	France	A famous resort at the base of Mont Blanc.	mountain_town_3.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
5	Queenstown	New Zealand	A resort town on New Zealand South Island.	mountain_town_5.jpg	Oceania	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
6	Cortina de Ampezzo	Italy	An upscale ski resort town in the Dolomites.	mountain_town_6.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
8	St. Moritz	Switzerland	A luxury alpine resort town.	mountain_town_8.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
34	Leh	India	A town in the Indian Himalayas.	mountain_town_34.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
35	Thredbo	Australia	A village and ski resort.	mountain_town_35.jpg	Oceania	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
36	Sapa	Vietnam	A town in the Hoàng Liên Son Mountains.	mountain_town_36.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
37	Cervinia	Italy	A ski resort at the foot of the Matterhorn.	mountain_town_37.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
38	Niseko	Japan	A town on Japan northern Hokkaido Island.	mountain_town_38.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
39	Queenstown	New Zealand	A resort town in Otago.	mountain_town_39.jpg	Oceania	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
40	Wanaka	New Zealand	A resort town on New Zealand South Island.	mountain_town_40.jpg	Oceania	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
41	Hakuba	Japan	A village in the Japanese Alps.	mountain_town_41.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
42	Auli	India	A Himalayan ski resort.	mountain_town_42.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
43	Gulmarg	India	A town in the Pir Panjal range.	mountain_town_43.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
44	Shangri-La	China	A city in the Yunnan Province.	mountain_town_44.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
4	Aspen	USA	A ski resort town in the Rocky Mountains Surely it is	mountain_1739039165284.jpg	North America	2024-07-12 10:07:58.016023-07	2025-02-08 10:26:05.295416-08
46	Big Sky	USA	A resort town in Montana.	mountain_town_46.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
47	Jackson	USA	A town in Jackson Hole valley.	mountain_town_47.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
48	Taos	USA	A town in New Mexico high desert.	mountain_town_48.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
49	Durango	USA	A city in southwest Colorado.	mountain_town_49.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
50	Lake Louise	Canada	A hamlet in Banff National Park.	mountain_town_50.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
54	Next Trip	Nepal	Not very special but high af	https://japanupclose.web-japan.org/files/100387812.jpg	North America	2025-02-08 09:20:16.970955-08	2025-02-08 09:20:16.970955-08
7	Whistler	Canada	A town north of Vancouver, known for Whistler Blackcomb ski resort.	mountain_town_7.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
9	Vail	USA	A small town at the base of Vail Mountain.	mountain_town_9.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
10	Garmisch-Partenkirchen	Germany	A mountain resort town in Bavaria.	mountain_town_10.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
11	Interlaken	Switzerland	A traditional resort town in the Bernese Oberland.	mountain_town_11.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
12	Leavenworth	USA	A Bavarian-styled village in Washington State.	mountain_town_12.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
13	Telluride	USA	A former Victorian mining town in Colorado Rocky Mountains.	mountain_town_13.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
14	Stowe	USA	A town in northern Vermont, known for Stowe Mountain Resort.	mountain_town_14.jpg	North America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
15	Wengen	Switzerland	A car-free village in the Bernese Oberland.	mountain_town_15.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
16	Grindelwald	Switzerland	A village in the Bernese Alps.	mountain_town_16.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
17	Zakopane	Poland	A resort town in the Tatra Mountains.	mountain_town_17.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
18	Hallstatt	Austria	A lakeside village in the Salzkammergut region.	mountain_town_18.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
19	Kitzbühel	Austria	A small Alpine town in the Kitzbühel Alps.	mountain_town_19.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
20	Mürren	Switzerland	A traditional Walser mountain village.	mountain_town_20.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
21	Zell am See	Austria	An Austrian town on Lake Zell.	mountain_town_21.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
22	Bled	Slovenia	A town on Lake Bled, in the Julian Alps.	mountain_town_22.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
23	Morzine	France	A town in the French Alps.	mountain_town_23.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
24	Mayrhofen	Austria	A town in the Zillertal valley.	mountain_town_24.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
25	Gstaad	Switzerland	A resort town in the Bernese Oberland.	mountain_town_25.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
26	Soldeu	Andorra	A village in the parish of Canillo.	mountain_town_26.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
27	Bansko	Bulgaria	A town at the foot of the Pirin Mountains.	mountain_town_27.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
28	Bariloche	Argentina	A town in the Argentine Patagonia.	mountain_town_28.jpg	South America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
29	Pucon	Chile	A town by Lake Villarrica.	mountain_town_29.jpg	South America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
30	Courmayeur	Italy	An Alpine resort in northwest Italy.	mountain_town_30.jpg	Europe	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
31	Huaraz	Peru	A city in the Peruvian Andes.	mountain_town_31.jpg	South America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
32	San Carlos de Bariloche	Argentina	A city in the Argentine Patagonia.	mountain_town_32.jpg	South America	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
33	Manali	India	A high-altitude Himalayan resort town.	mountain_town_33.jpg	Asia	2024-07-12 10:07:58.016023-07	2024-07-12 10:07:58.016023-07
51	Jap	Japan	Veruy special	https://japanupclose.web-japan.org/files/100387808.jpg	Asia	2025-02-08 09:03:26.382907-08	2025-02-08 09:03:26.382907-08
55	IDKWHATISIT	KINGDOM	Very fucking special	mountain_1739037607456-353717411.jpg	North America	2025-02-08 09:20:47.874186-08	2025-02-08 10:00:07.477596-08
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, type, title, content, data, is_read, created_at) FROM stdin;
1	FAQ	New FAQ from IDK	ON fixing the problems	{"name": "IDK", "email": "idk@gmail.com", "faqId": 8, "message": "The web is bad as fuck ", "subject": "ON fixing the problems"}	t	2025-02-11 20:09:33.08597
2	FAQ	New FAQ from Idk helppppp	Messi Ronaldo 	{"name": "Idk helppppp", "email": "hello@gmail.com", "faqId": 9, "message": "Kaka dembele", "subject": "Messi Ronaldo ", "created_at": "2025-02-11T13:20:57.477Z"}	t	2025-02-11 20:20:57.477
3	FAQ	New FAQ from HanhpHuc	12304	{"name": "HanhpHuc", "email": "hp@gmail..com", "faqId": 10, "message": "You oaoaoaoao", "subject": "12304", "created_at": "2025-02-11T13:15:57.199Z"}	t	2025-02-11 20:15:57.199
4	FAQ	New FAQ from noem	mo111	{"name": "noem", "email": "1@gmail.com", "faqId": 11, "message": "mvsoavmas", "subject": "mo111", "created_at": "2025-02-11T13:16:40.848Z"}	t	2025-02-11 20:16:40.848
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, mountain_id, user_username, title, content, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, mountain_id, username, rating, comment, is_flagged, created_at, updated_at) FROM stdin;
1	14	guest5	5	beautiful	\N	2024-12-14 03:24:27.377765-08	2024-12-14 03:24:27.377765-08
2	14	guest3	5	best of the best	\N	2024-12-14 03:25:42.91403-08	2024-12-14 03:25:42.91403-08
3	14	guest5	4	great as well	\N	2024-12-14 03:36:38.038881-08	2024-12-14 03:36:38.038881-08
4	35	guest5	2	Its good but need a lot more\n	\N	2025-02-06 22:34:40.151852-08	2025-02-06 22:34:40.151852-08
5	2	guest5	4	Test the current condtiion	\N	2025-02-06 23:22:48.370577-08	2025-02-06 23:22:48.370577-08
6	2	guest5	5	Hell uyeah	\N	2025-02-06 23:22:56.466334-08	2025-02-06 23:22:56.466334-08
7	2	guest5	5	Good shit	\N	2025-02-06 23:23:02.388553-08	2025-02-06 23:23:02.388553-08
8	2	guest5	4	Hell yeahhhh	\N	2025-02-06 23:57:37.718416-08	2025-02-06 23:57:37.718416-08
9	2	guest5	1	Hell expereince	\N	2025-02-07 01:34:06.232758-08	2025-02-07 01:34:06.232758-08
10	2	guest5	3	Whiff man	\N	2025-02-07 02:42:18.089363-08	2025-02-07 02:42:18.089363-08
11	2	guest5	5	Holy cow its so good 	\N	2025-02-07 03:11:39.026693-08	2025-02-07 03:11:39.026693-08
12	2	guest5	4	No way 	\N	2025-02-07 03:18:29.407464-08	2025-02-07 03:18:29.407464-08
13	50	guest5	4	Louise alver	\N	2025-02-07 03:18:37.925091-08	2025-02-07 03:18:37.925091-08
14	2	guest5	3	My thought is hard to explain	\N	2025-02-07 03:23:29.436209-08	2025-02-07 03:23:29.436209-08
15	2	guest5	5	Currently awseome	\N	2025-02-07 03:31:58.905995-08	2025-02-07 03:31:58.905995-08
16	2	guest5	5	Yeah hell yeah	\N	2025-02-07 03:33:48.502945-08	2025-02-07 03:33:48.502945-08
17	2	guest5	5	hell yeah 	\N	2025-02-07 03:41:42.556298-08	2025-02-07 03:41:42.556298-08
18	2	guest5	4	What the fuck is going onnnnn !!!!	\N	2025-02-08 06:02:03.185448-08	2025-02-08 06:02:03.185448-08
19	2	guest5	5	Helloe	\N	2025-02-08 10:12:59.470025-08	2025-02-08 10:12:59.470025-08
20	2	guest5	4	Holy cow	\N	2025-02-09 03:09:31.930257-08	2025-02-09 03:09:31.930257-08
\.


--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_favorites (id, user_username, mountain_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (username, user_password, user_role, email, first_name, last_name, bio, created_at, updated_at, avatar_url, avatar_path, avatar_hash) FROM stdin;
guest6	guestpassword	guest	guest6_3e91e52d@example.com	Alan Tran	123	\N	2024-07-12 10:02:46.975726-07	2025-02-08 06:32:13.900795-08	/storage/avatars/default-avatar.png	\N	\N
guest8	guestpassword	guest	guest8_7630cb8f@example.com	Alan	Mister	Gotcha bnit	2024-07-12 10:02:46.975726-07	2025-02-08 06:37:33.139379-08	/storage/avatars/3afa9ab8d9f054d36b6b5fe8980328c15333f1352680f5a5820e32f36c54d957.jpg	avatars\\3afa9ab8d9f054d36b6b5fe8980328c15333f1352680f5a5820e32f36c54d957.jpg	\N
guest4	guestpassword	guest	guest412amders_a9e49312@example.com	Henry	ViceReds	Make somethin coolgggg	2024-07-12 10:02:46.975726-07	2025-02-08 06:39:20.366973-08	/storage/avatars/05fab89ef38393254dd29d63dce5067ab52236c8acf562ee38c20434397bffcb.jpg	avatars\\05fab89ef38393254dd29d63dce5067ab52236c8acf562ee38c20434397bffcb.jpg	\N
hgKieu	123456	guest	hoangKIEU@gmail.com	111	1111		2025-02-08 05:22:09.282533-08	2025-02-08 05:58:43.745996-08	/storage/avatars/fcd9e932b510cea8764146092c3d9b7f23b84791ff4dc2b0a1a2b14ec1db0536.jpeg	avatars\\fcd9e932b510cea8764146092c3d9b7f23b84791ff4dc2b0a1a2b14ec1db0536.jpeg	\N
otherGirls1231	12345678	guest	otherGirl1111@gmail.com	Johny 	Johny		2025-02-08 05:49:24.79521-08	2025-02-09 09:16:43.415422-08	/storage/avatars/default-avatar.png	\N	\N
admin	adminpassword	admin	admin_423cab05@example.com			\N	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest7	guestpassword	guest	guest7_234b2ce9@example.com			\N	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest9	guestpassword	guest	guest9_d060a7bc@example.com			\N	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest10	guestpassword	guest	guest10_707afca1@example.com			\N	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest111	password123	guest	guest@gmail.com			\N	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest123	guestpassword	guest	guest1234_50e36b7c@example.com			\N	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest2	guestpassword	guest	guest2_ed1851a2229@example.com			\N	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest3	guestpassword	guest	manhhung@gmail.com	Manh	Hung2	A life of whisly	2024-07-12 10:02:46.975726-07	2024-07-12 10:02:46.975726-07	/storage/avatars/default-avatar.png	\N	\N
guest5	guestpassword	guest	adamsmith@gmail.com	Adam	Smithm	A life a whisky or two\n	2024-07-12 10:02:46.975726-07	2025-02-11 18:51:23.605836-08	/storage/avatars/433f118920598a34639763bdcf4fe6a059e637ee2bc09133a97b0d565354b74c.jpg	avatars\\433f118920598a34639763bdcf4fe6a059e637ee2bc09133a97b0d565354b74c.jpg	\N
\.


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: faqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faqs_id_seq', 11, true);


--
-- Name: mountains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mountains_id_seq', 55, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 4, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 1, false);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 20, true);


--
-- Name: user_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_favorites_id_seq', 1, false);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: mountains mountains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mountains
    ADD CONSTRAINT mountains_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: user_favorites unique_user_mountain; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT unique_user_mountain UNIQUE (user_username, mountain_id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (username);


--
-- Name: idx_mountains_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mountains_name ON public.mountains USING btree (name);


--
-- Name: idx_posts_mountain_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_mountain_id ON public.posts USING btree (mountain_id);


--
-- Name: idx_reviews_mountain_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_mountain_id ON public.reviews USING btree (mountain_id);


--
-- Name: idx_user_favorites_mountain_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_favorites_mountain_id ON public.user_favorites USING btree (mountain_id);


--
-- Name: idx_user_favorites_user_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_favorites_user_username ON public.user_favorites USING btree (user_username);


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);


--
-- Name: comments comments_user_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_username_fkey FOREIGN KEY (user_username) REFERENCES public.users(username);


--
-- Name: posts posts_mountain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_mountain_id_fkey FOREIGN KEY (mountain_id) REFERENCES public.mountains(id);


--
-- Name: posts posts_user_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_username_fkey FOREIGN KEY (user_username) REFERENCES public.users(username);


--
-- Name: reviews reviews_mountain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_mountain_id_fkey FOREIGN KEY (mountain_id) REFERENCES public.mountains(id);


--
-- Name: reviews reviews_user_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_username_fkey FOREIGN KEY (username) REFERENCES public.users(username);


--
-- Name: user_favorites user_favorites_mountain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_mountain_id_fkey FOREIGN KEY (mountain_id) REFERENCES public.mountains(id);


--
-- Name: user_favorites user_favorites_user_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_username_fkey FOREIGN KEY (user_username) REFERENCES public.users(username);


--
-- PostgreSQL database dump complete
--


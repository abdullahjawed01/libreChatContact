# Fullstack Intern Assignment: Contact Workspace Integration for LibreChat

## 🚀 Overview
This repository contains a full-stack **MERN** implementation of a **Contacts Workspace**, seamlessly integrating a robust Contacts management system with a Gemini-powered AI assistant. It expands upon standard chat interfaces by providing a structured data management layer and an intelligent retrieval system.

## ✨ Features Implemented
### Core Objectives
1. **Contacts Data Model (MongoDB/Mongoose)**
   - Designed to handle highly varied CSV datasets and scalable up to 1M+ contacts.
   - Core fields explicitly typed (`id`, `name`, `company`, `role`, `email`, `notes`, `created_at`).
   - Built a dynamic `attributes` Map to ingest and store any arbitrary/unknown fields provided in future CSV imports without breaking the schema.
   - Mongoose `$text` indexing applied across name, company, role, and email fields for rapid, native querying.

2. **Contact Importing (CSV Processing)**
   - Created a robust CSV parser (`csv-parse`) that fetches data directly from specified HTTP endpoints or local files.
   - Implemented an intelligent mapping layer that concatenates `first_name` + `middle_name` + `last_name` into `name`.
   - Maps `company_name` to `company` and `designation` to `role`. All leftover fields (e.g., `dob`, `kyc`) are structurally preserved in the `attributes` dictionary.

3. **Contacts UI (React + Tailwind + Framer Motion)**
   - Built an incredibly modern, premium 3D "glassmorphism" aesthetic.
   - Includes a high-performance interactive table supporting hovering, sorting context, and dynamic attribute rendering.
   - Integrated a floating **Nexus Intelligence Assistant** (ChatBox) directly alongside the contacts table.

4. **Chat Integration & Context Retrieval (Gemini API)**
   - **Crucial Architecture Decision**: Instead of blindly dumping the whole database into the LLM context, I implemented a **Two-Pass AI Retrieval System**.
   - **Pass 1 (Intent Parsing)**: The system sends the user's natural language query to Gemini to act as an intent-extractor, securely converting "Who is the CTO of Acme?" into a JSON filter `{ "role": "CTO", "company": "Acme" }`.
   - **Pass 2 (Targeted Fetch & Synthesis)**: The backend securely queries MongoDB using these exact parameters, returning only the top 10 relevant documents. These specific documents are then formatted into a strict context block, and Gemini answers the prompt relying *only* on that injected organizational telemetry.

### Bonus Features
- **Dynamic Search Filtering**: A fluid search bar that instantly triggers targeted GET APIs to refine the table data.
- **Contact Modification (Edit/Delete)**: Full CRUD capability built into a gorgeous `ContactDetailsModal`. Update attributes and add manual intelligence notes.
- **Instant AI Linkage (Click-to-Ask)**: Clicking "Query AI Link" on a specific contact instantly injects a targeted query about that person into the ChatBox, drastically reducing friction for the end-user.

---

## 🛠️ Architecture Decisions

### 1. The Dynamic "Attributes" Schema pattern
When dealing with multiple unknown CSV files, strictly defining every possible column in Mongoose leads to fragile code. By defining an `attributes: { type: Map, of: String }`, the application can swallow *any* CSV shape while still strongly enforcing the required core fields. This is paramount for scalability across 100k+ diverse contacts.

### 2. LLM-Assisted Query Parsing over Regex
Using standard Regex or NLP libraries (like `compromise`) to extract company names and roles from a question is incredibly brittle. By utilizing a lightweight zero-shot prompt with Gemini (`parseQuery` in `aiService.ts`), the backend is able to accurately extract complex search conditions ("Who manages engineering at that shoe startup?") into strict MongoDB queries. This ensures the database does the heavy lifting, saving massive amounts of API token costs.

### 3. Frontend Separation of Concerns
The frontend strictly delineates state management from UI rendering. The API layer (`contactApi.ts` / `chatApi.ts`) abstracts all Axios logic, allowing the React components to simply await promises. The `ContactsPage` acts as the single source of truth for the contact state, passing specific functions down to dumb UI components like the `ContactDetailsModal`.

---

## 🚦 Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port `27017`
- A valid Google Gemini API Key.

### Environment Setup
Create a `.env` in the `/server` directory:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=5000
MONGO_URI=mongodb://localhost:27017/contacts-ai
```

### Installation
1. Server:
```bash
cd server
npm install
npm run dev
```

2. Client:
```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📊 Dataset Analysis & Campaign Insights

The platform includes a dedicated **Campaign Insights** module that leverages MongoDB aggregation pipelines to process datasets of up to 1M+ contacts in real-time. This analysis identifies key segments to drive high-conversion marketing strategies.

### 🔍 Strategic Identifiers

1.  **Geographic Demographics (Location Clusters)**:
    - Automatically groups contacts by city, state, or region using normalized address attributes.
    - **Strategy**: Promote region-specific events, local meetups, or run geo-targeted ad campaigns to increase local relevance.

2.  **Role-Based Targeting (Decision Makers)**:
    - Specifically isolates high-value roles such as **CEO, CTO, Founder, and VP Engineering**.
    - **Strategy**: Deploy "Top-Down" sales sequences focused on organizational leadership and high-level value propositions.

3.  **Industry Segmentation**:
    - Groups contacts by industry vertical (e.g., Fintech, AI Infrastructure, SaaS).
    - **Strategy**: Send industry-specific whitepapers, case studies, and tailored messaging that addresses vertical-specific pain points.

4.  **Interest-Based Campaigns**:
    - Leverages arbitrary tags and interest fields to build cohorts around specific topics like "Cloud Computing" or "Startup Funding".
    - **Strategy**: The highest engagement dimension—send hyper-personalized content updates that match the explicit interests of each contact segment.

### 📈 Performance Architecture
To maintain sub-second response times even with 100k+ contacts, the system uses:
- **Compound B-Tree Indexes**: Optimized for sorting and grouping on company and role fields.
- **Aggregation Facets**: Concurrent processing of multiple data dimensions in a single database pass.
- **Memory Efficiency**: Processes data as a stream within MongoDB, avoiding large object instantiation in the Node.js runtime.

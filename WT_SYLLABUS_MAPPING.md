# Web Technology (2310362L) — Syllabus Mapping & Presentation Guide

> **Institution:** MIT Academy of Engineering (An Autonomous Institute Affiliated to Savitribai Phule Pune University)  
> **School:** School of Computer Engineering — Software Engineering  
> **Course:** Third Year B.Tech — Web Technology (`2310362L`)  
> **Academic Year:** 2025–2026 (Rev. 2023 [NEP]) | **Credits:** 2  
> **Evaluation Scheme:** Continuous Assessment (CA): 35 Marks | Practical / Presentation: 40 Marks | **Total:** 75 Marks  

---

## 🎯 Executive Summary & Architectural Overview

This codebase implements an enterprise-grade **Full Stack MERN Architecture (MongoDB, ExpressJS, ReactJS, NodeJS)** paired with **Bootstrap 5 responsive design**, developed to align 100% with every requirement, practical assignment, and course outcome specified in `wtco.pdf`.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRESENTATION LAYER                                   │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│    Practical 01 & 02: Bootstrap Portal │        Practical 03: ReactJS Framework        │
│   • Responsive Grid Layouts (HTML/CSS3)│       • React 18 Component Tree with Hooks    │
│   • Bootstrap 5.3 Navbar, Modals, Cards│       • Real-Time Client-Side Form Validation │
│   • Interactive Calculator (DOM/JS)    │       • Interactive Calculator & AI Voice Chat│
│   • Chat Window & JSON/Array Data Store│       • Local and REST State Synchronization  │
│   [wt-portal/index.html]               │       [client-react/index.html]               │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
                                         │  HTTP / REST / JSON
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   APPLICATION TIER                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│           Practical 04 & 05: NodeJS & ExpressJS Application Framework                  │
│   • Node Core Engine: fs, events.EventEmitter, crypto, stream, os [server/routes/node] │
│   • Express Middleware Pipeline: CORS, JSON Parser, Custom HTTP Logger [server/app.js] │
│   • Server-Side Validation Middleware [server/middleware/nodeValidator.js]             │
│   • Practical 06: RESTful API CRUD Engine (/api/students, /api/records)                │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                         │  ODM / Drivers
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATA / PERSISTENCE TIER                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                     Practical 07: NoSQL Multi-Database Architecture                    │
│   • MongoDB & Mongoose: Document Schemas, Validation & Dual-Mode Fallback              │
│   • Amazon DynamoDB Adapter: Single-table key-value session partition [Self-Study]     │
│   • Apache Cassandra Adapter: CQL keyspace & wide-column time-series [Self-Study]      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Course Outcomes (CO) to Codebase Mapping

| Course Outcome | Level | Description | Implementation in Codebase |
| :--- | :---: | :--- | :--- |
| **2310362L.CO.1** | **[L3]** | Construct websites using fundamental web languages, technologies and tools. | [`wt-portal/index.html`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/wt-portal/index.html), [`wt-portal/app.js`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/wt-portal/app.js), [`wt-portal/style.css`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/wt-portal/style.css) |
| **2310362L.CO.2** | **[L3]** | To Develop a front-end web application using ReactJS. | [`client-react/index.html`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/client-react/index.html), [`client-react/package.json`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/client-react/package.json) |
| **2310362L.CO.3** | **[L3]** | To Construct and configure a backend server using NodeJS and ExpressJS framework. | [`server/server.js`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/server/server.js), [`server/app.js`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/server/app.js), [`server/middleware/nodeValidator.js`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/server/middleware/nodeValidator.js) |
| **2310362L.CO.4** | **[L3]** | To Design a RESTful API for the front-end to access backend services. | [`server/routes/students.js`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/server/routes/students.js), [`server/routes/records.js`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/server/routes/records.js), [`docs/StoryLab_Voice_REST_API.postman_collection.json`](file:///c:/Users/prita/Desktop/Pritam/Cavprojects/StoryLab-Voice-PR/docs/StoryLab_Voice_REST_API.postman_collection.json) |

---

## 🔬 Practical-by-Practical Implementation Guide

### Practical No. 01: HTML, CSS and Frameworks (Bootstrap)
* **Syllabus Requirement:** Pre-work: Installation & Configuration of Web Application Servers (Tomcat). Design and develop any suitable single-page web application using HTML/DHTML, CSS/CSS3 and Framework (Bootstrap). Responsive website design with respect to layouts.
* **Code Location:**
  - `wt-portal/index.html`: Fully responsive single-page portal utilizing Bootstrap 5.3 (Navbar, Hero Jumbotron, Responsive Grid `col-lg-*`, Modals, Badges, Cards, Alert banners).
  - `wt-portal/style.css`: Custom CSS3 styling with transitions, gradients, and elevation.
  - `docs/TOMCAT_DEPLOYMENT.md`: Complete Apache Tomcat 10 setup guide, port configuration, WAR structure, and reverse-proxy setup.
* **How to Demonstrate:** Open `wt-portal/index.html` in browser. Resize the window or use Chrome DevTools device mode (Mobile, Tablet, Desktop) to show responsive layout fluid adaptivity.

---

### Practical No. 02: Javascript
* **Syllabus Requirement:** Design and develop any suitable web application to demonstrate the capabilities of Javascript. Use JSON and Array for storing the data, before saving the data, validate it and show proper error messages. Build web pages for Interactive type applications (e.g. Calculator, Chat windows etc.).
* **Code Location:**
  - `wt-portal/app.js` & `wt-portal/index.html`:
    1. **Interactive Calculator:** Arithmetic evaluator, state history, clear, backspace, and error handling.
    2. **Interactive Chat Console:** Simulates voice/text tutoring; maintains conversation in an array of JSON objects.
    3. **JSON & Array Data Store with Validation:** Validates 12-digit PRN, name regex, email format, and age boundary. Rejects invalid submissions with red feedback and appends valid records to `studentDataStoreArray` with export capability.
* **How to Demonstrate:** On `wt-portal/index.html`, perform calculations on the calculator, chat with the AI console, and try submitting the student form with missing or invalid fields to show live error validation.

---

### Practical No. 03: Front-End JavaScript Frameworks (ReactJS)
* **Syllabus Requirement:** Design and deploy a web application to demonstrate client-side validation using ReactJS. Client-side validation / interactive type applications.
* **Code Location:**
  - `client-react/index.html`: Standalone React 18 application with Babel.
  - Features:
    - `StudentRegistrationForm`: Controlled inputs, `useState` for form fields, errors, and touched states. Real-time client-side validation for PRN format, name regex, email structure, and age limits. Shows `.is-invalid` and `.is-valid` green/red indicators.
    - `InteractiveCalculator`: React component maintaining computation state via hooks.
    - `VoiceChatSimulator`: React component with array state for chat messages.
* **How to Demonstrate:** Open `client-react/index.html` in browser. Fill in the form; notice real-time error feedback as fields lose focus. Enter valid data to watch the student table immediately update via React state!

---

### Practical No. 04: Server-Side Development (NodeJS)
* **Syllabus Requirement:** Design, develop and deploy a web application to demonstrate server-side validation using NodeJS. Student will demonstrate all the capabilities of NodeJS.
* **Code Location:**
  - `server/middleware/nodeValidator.js`: Pure Node.js validation function without frameworks; validates PRN, regex sanitization, and returns structured errors.
  - `server/routes/nodeCapabilities.js`: Demonstrates key native Node.js core modules:
    1. `fs`: Creates and audits server access logs (`/api/node/fs-demo`).
    2. `events` (`EventEmitter`): Custom `VoiceAuditBus` event bus for asynchronous voice telemetry (`/api/node/event-emit`).
    3. `crypto`: Computes SHA-256 hashes, generates 128-bit cryptographic tokens and UUIDs (`/api/node/crypto-demo`).
    4. `stream`: Delivers chunked transfer HTTP stream responses (`/api/node/stream-demo`).
    5. `os` & `process`: Memory usage, platform architecture, CPU cores, uptime (`/api/node/runtime-info`).
* **How to Demonstrate:** Call `http://localhost:5000/api/node/runtime-info` and `http://localhost:5000/api/node/crypto-demo` in browser or terminal.

---

### Practical No. 05: Web Application Framework (ExpressJS)
* **Syllabus Requirement:** Design, develop and deploy a web application to demonstrate server-side validation using ExpressJS. Student will demonstrate all the capabilities of ExpressJS.
* **Code Location:**
  - `server/app.js`: Express application instance, CORS middleware, body parsers, custom request logging middleware, static route serving, 404 handler, and centralized error handling middleware.
  - `server/middleware/expressValidator.js`: Express request interception pipeline that inspects request bodies and halts invalid payloads with HTTP 400 Bad Request.
* **How to Demonstrate:** Run `node server/server.js` and view incoming request logs in the terminal console.

---

### Practical No. 06: RESTful API (CRUD Operations)
* **Syllabus Requirement:** Create an API to perform CRUD operations in the database and deploy the application on any web hosting provider and test the API using Postman.
* **Code Location:**
  - `server/routes/students.js`:
    - `POST   /api/students` -> **[C]reate** student in database.
    - `GET    /api/students` -> **[R]ead** all students (with filtering).
    - `GET    /api/students/:prn` -> **[R]ead** single student.
    - `PUT    /api/students/:prn` -> **[U]pdate** student record.
    - `DELETE /api/students/:prn` -> **[D]elete** student record.
  - `server/routes/records.js`: CRUD for student learning records and session duration.
  - `docs/StoryLab_Voice_REST_API.postman_collection.json`: Importable Postman v2.1 collection with assertions and test scripts.
  - `server/tests/crud.test.js`: Automated test runner executing the complete CRUD test lifecycle.
* **How to Demonstrate:** Run `npm run test:api` to see 100% test pass execution right in the terminal.

---

### Practical No. 07: NoSQL Database (MongoDB, DynamoDB, Cassandra)
* **Syllabus Requirement:** Design, develop and deploy a web application to interact with NoSQL database from a Node application. Self-study component: Fundamentals of DynamoDB, Fundamentals of Apache Cassandra.
* **Code Location:**
  - `server/config/db.js`: Mongoose connection manager with intelligent auto-fallback to an in-memory NoSQL document store for offline presentations.
  - `server/models/Student.js`: Mongoose schema with type constraints and regex validations.
  - `server/models/LearningRecord.js`: Mongoose schema for time-series learning metrics.
  - `server/models/StorySession.js` & `server/models/LabExperiment.js`: NoSQL schemas for branch decisions and lab apparatus.
  - `server/nosql-adapters/dynamoAdapter.js`: Single-table partition key (`PK`) and sort key (`SK`) implementation for **Amazon DynamoDB**.
  - `server/nosql-adapters/cassandraAdapter.js`: CQL keyspace and wide-column definition for **Apache Cassandra**.
  - `server/routes/nosqlDemo.js`: Interactive endpoints showcasing MongoDB, DynamoDB, and Cassandra operations.
* **How to Demonstrate:** Navigate to `http://localhost:5000/api/nosql/overview` and `http://localhost:5000/api/nosql/cassandra/schema`.

---

## 🚀 How to Run the Presentation Demos

### 1. Start the Backend Server (Port 5000)
```bash
npm start
# or
node server/server.js
```
The server will output:
```
[Express & Node.js] Server is running on: http://localhost:5000
[RESTful API Root] Explore endpoints at: http://localhost:5000/api
[Bootstrap Portal] Practical 01 & 02:    http://localhost:5000/wt-portal/index.html
[React.js Portal]  Practical 03:         http://localhost:5000/react-app/index.html
```

### 2. Run the Automated CRUD API Test Suite
```bash
npm run test:api
# or
node server/tests/crud.test.js
```
*Executes all 8 CRUD and validation tests against the server and prints a pass report.*

### 3. Open the Front-End Applications
- **Bootstrap Responsive Portal (Practical 01 & 02):** Open `wt-portal/index.html` in any browser.
- **ReactJS Client-Side Validation (Practical 03):** Open `client-react/index.html` in any browser.
- **StoryLab Voice Field Terminal (PWA Foundation):** Open `index.html` in any browser.

---

## 💬 Frequently Asked Viva / Presentation Questions

### Q1: What is the MERN Stack and how is it used in this project?
> **Answer:** MERN stands for **MongoDB** (NoSQL database), **ExpressJS** (backend web application framework), **ReactJS** (front-end UI library), and **NodeJS** (server JavaScript runtime). In our project:
> - **ReactJS** handles interactive client-side form validation and views (`client-react/index.html`).
> - **NodeJS & ExpressJS** power the RESTful API endpoints and server-side validation (`server/app.js`).
> - **MongoDB / NoSQL** stores persistent student records, story sessions, and virtual lab results (`server/models/`).

### Q2: How does client-side validation differ from server-side validation?
> **Answer:** 
> - **Client-Side Validation (React / JS):** Executes in the user's browser for instant UX feedback before network transmission (`client-react/index.html` & `wt-portal/app.js`). However, it can be bypassed.
> - **Server-Side Validation (Node / Express):** Executes on the server (`server/middleware/nodeValidator.js`). It is mandatory for security, data integrity, and injection prevention before any database write.

### Q3: How do SQL databases differ from NoSQL databases like MongoDB?
> **Answer:** SQL databases are relational, table-based, and enforce rigid schemas with ACID transactions. NoSQL databases like MongoDB are document-oriented, schema-flexible, and store data in JSON/BSON format, making them ideal for hierarchical, evolving educational data like branching story nodes and lab apparatus states.

### Q4: Explain the difference between DynamoDB and Apache Cassandra (Practical 07 Self-Study).
> **Answer:**
> - **Amazon DynamoDB:** A managed key-value and document database optimized for single-digit millisecond latency using Partition and Sort keys (`server/nosql-adapters/dynamoAdapter.js`).
> - **Apache Cassandra:** A distributed, masterless wide-column store designed for high-write throughput and linear scalability, utilizing CQL (`server/nosql-adapters/cassandraAdapter.js`).


# Project Library Inventory

This document lists the direct libraries and frameworks used across the Smart School System repository.

Scope:
- Includes direct dependencies from `package.json` and `requirements.txt`
- Excludes transitive `node_modules` packages
- Snapshot based on manifests found on `2026-03-24`

## Manifest Sources

### Python
- `requirements.txt`
- `student dashboard/requirements.txt`

### Node / React
- `Admin Dashboard/Admin Dashboard/backend/package.json`
- `Admin Dashboard/Admin Dashboard/frontend-react/package.json`
- `student dashboard/package.json`
- `student dashboard/frontend/package.json`
- `student portal/Std 1/Std 1/package.json`
- `student portal/Std 2/Std 2/package.json`
- `student portal/Std 3/Std 3/package.json`
- `student portal/Std 4/Std 4/package.json`
- `student portal/Std 5/Std 5/package.json`
- `student portal/Std 6/Std 6/Std 6/package.json`
- `student portal/Std 7/Std 3/package.json`
- `teacher portal/client/package.json`
- `teacher portal/server/package.json`

## Workspace Summary

| Workspace | Stack | Key Libraries |
| --- | --- | --- |
| Root app | Flask | Flask, Werkzeug, Jinja2 |
| Admin backend | Express + SQLite | express, better-sqlite3, jsonwebtoken, bcryptjs, googleapis |
| Admin frontend | React + Vite | react, react-router-dom, jspdf, jspdf-autotable |
| Student dashboard API | FastAPI + AI/RAG | fastapi, uvicorn, groq, langchain, qdrant-client |
| Student dashboard frontend | React + Redux + Vite | react, axios, @reduxjs/toolkit, framer-motion, react-pdf, recharts |
| Student portals Std 1-7 | React + Vite + TS | react, framer-motion, react-pdf, react-pageflip, recharts, @google/genai |
| Teacher portal client | React | axios, recharts, jspdf, xlsx, tailwindcss |
| Teacher portal server | Express + MongoDB | express, mongoose, multer, nodemailer, pdfkit |

## Python Libraries

### Root Flask App
Source: `requirements.txt`

| Library | Version |
| --- | --- |
| Flask | `2.3.3` |
| Werkzeug | `2.3.7` |
| Jinja2 | `3.1.2` |
| MarkupSafe | `2.1.3` |
| click | `8.1.7` |
| itsdangerous | `2.1.2` |

### Student Dashboard API / AI Service
Source: `student dashboard/requirements.txt`

| Library | Version |
| --- | --- |
| fastapi | `0.109.0` |
| uvicorn | `0.27.0` |
| jinja2 | `3.1.3` |
| python-multipart | `0.0.6` |
| python-dotenv | `1.0.0` |
| python-jose[cryptography] | `3.3.0` |
| passlib[bcrypt] | `1.7.4` |
| groq | `>=1.0.0` |
| pypdf | `>=4.0.0` |
| scikit-learn | `>=1.3.0` |
| numpy | `>=1.24.0` |
| langchain | `>=0.3.0` |
| langchain-text-splitters | `>=0.3.0` |
| langchain-huggingface | `>=0.1.0` |
| sentence-transformers | `>=3.0.0` |
| qdrant-client | `>=1.12.0` |

## Node / React Libraries

### Admin Dashboard Backend
Source: `Admin Dashboard/Admin Dashboard/backend/package.json`

#### Dependencies
- `bcryptjs` `^2.4.3`
- `better-sqlite3` `^11.7.0`
- `cors` `^2.8.5`
- `dotenv` `^16.4.7`
- `express` `^4.21.2`
- `googleapis` `^171.4.0`
- `jsonwebtoken` `^9.0.2`

### Admin Dashboard Frontend
Source: `Admin Dashboard/Admin Dashboard/frontend-react/package.json`

#### Dependencies
- `react` `^18.2.0`
- `react-dom` `^18.2.0`
- `react-router-dom` `^6.20.0`
- `jspdf` `^2.5.1`
- `jspdf-autotable` `^3.8.1`

#### Dev Dependencies
- `@vitejs/plugin-react` `^4.2.0`
- `vite` `^5.0.8`

### Student Dashboard Root Frontend
Source: `student dashboard/package.json`

#### Dependencies
- `gsap` `^3.14.2`
- `lottie-react` `^2.4.1`

Note:
- This manifest currently has empty `name` and `version` fields.

### Student Dashboard Frontend App
Source: `student dashboard/frontend/package.json`

#### Dependencies
- `@reduxjs/toolkit` `^2.0.1`
- `axios` `^1.6.2`
- `canvas-confetti` `^1.9.4`
- `framer-motion` `^10.16.16`
- `lucide-react` `^0.577.0`
- `pdfjs-dist` `^5.5.207`
- `react` `^18.2.0`
- `react-dom` `^18.2.0`
- `react-easy-crop` `^5.5.6`
- `react-pageflip` `^2.0.3`
- `react-pdf` `^10.4.1`
- `react-redux` `^9.0.4`
- `react-router-dom` `^6.21.0`
- `recharts` `^3.7.0`

#### Dev Dependencies
- `@types/react` `^18.2.43`
- `@types/react-dom` `^18.2.17`
- `@vitejs/plugin-react` `^4.2.1`
- `vite` `^5.0.8`

### Student Portals Std 1, 2, 4, 5, 6
Sources:
- `student portal/Std 1/Std 1/package.json`
- `student portal/Std 2/Std 2/package.json`
- `student portal/Std 4/Std 4/package.json`
- `student portal/Std 5/Std 5/package.json`
- `student portal/Std 6/Std 6/Std 6/package.json`

#### Shared Dependencies
- `@google/genai` `^1.41.0`
- `@types/howler` `^2.2.12`
- `canvas-confetti` `^1.9.4`
- `framer-motion` `^12.34.1`
- `howler` `^2.2.4`
- `jspdf` `^4.1.0`
- `pdfjs-dist` `5.4.296` or `^5.4.296`
- `react` `^19.2.4`
- `react-dom` `^19.2.4`
- `react-intersection-observer` `^10.0.3`
- `react-pageflip` `^2.0.3`
- `react-pdf` `^10.4.0`
- `recharts` `^3.7.0`

#### Shared Dev Dependencies
- `@types/canvas-confetti` `^1.9.0`
- `@types/node` `^22.14.0`
- `@types/pdf-parse` `^1.1.5`
- `@vitejs/plugin-react` `^5.0.0`
- `pdf-parse` `^2.4.5`
- `typescript` `~5.8.2`
- `vite` `^6.2.0`

### Student Portals Std 3 and Std 7
Sources:
- `student portal/Std 3/Std 3/package.json`
- `student portal/Std 7/Std 3/package.json`

These use the same stack as Std 1/2/4/5/6, plus:
- `@fortawesome/fontawesome-free` `^7.2.0`

### Teacher Portal Client
Source: `teacher portal/client/package.json`

#### Dependencies
- `axios` `^1.13.5`
- `file-saver` `^2.0.5`
- `jspdf` `^4.2.0`
- `jspdf-autotable` `^5.0.7`
- `lucide-react` `^0.263.1`
- `react` `^18.0.0`
- `react-dom` `^18.0.0`
- `react-scripts` `^5.0.0`
- `recharts` `^2.15.4`
- `tailwindcss` `^3.0.0`
- `xlsx` `^0.18.5`

### Teacher Portal Server
Source: `teacher portal/server/package.json`

#### Dependencies
- `bcryptjs` `^3.0.3`
- `cors` `^2.8.5`
- `dotenv` `^17.3.1`
- `express` `^4.18.2`
- `express-rate-limit` `^8.2.1`
- `jsonwebtoken` `^9.0.3`
- `mongoose` `^7.0.0`
- `multer` `^1.4.4`
- `nodemailer` `^8.0.1`
- `pdfkit` `^0.13.0`

#### Dev Dependencies
- `nodemon` `^2.0.22`

## Repeated Core Libraries Across the Project

These libraries appear in multiple apps:

- `react`
- `react-dom`
- `react-router-dom`
- `vite`
- `framer-motion`
- `recharts`
- `jspdf`
- `react-pdf`
- `react-pageflip`
- `axios`
- `express`
- `cors`
- `dotenv`
- `jsonwebtoken`
- `bcryptjs`

## Notes

- Some student portal manifests have names that do not match their folder names exactly.
- The project contains both Flask-based and FastAPI-based Python services.
- The repository also contains multiple portal variants with overlapping dependency sets.
- No standalone `parent portal` package manifest was found during this scan.
- This file is intended as a direct dependency inventory, not a full SBOM.

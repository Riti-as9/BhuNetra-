# Bhunetra

Bhunetra is a North Eastern Region landslide command centre. The frontend uses
the Bhunetra API for risk prediction, monitored zones, alerts, analytics, and
the GSI historical landslide inventory map.

## Run locally

Open two terminals from this folder.

```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

```powershell
cd frontend
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). The API
documentation is available at `http://127.0.0.1:8000/docs`.

The GSI inventory is project data. Zone, alert, and analytics feeds are clearly
identified as demo monitoring data in the API response until a live sensor or
alert source is connected.

# n8n Sophos Central Node

Installation: die TypeScript-Dateien in dein n8n Custom-Node Repo kopieren, builden und n8n neu starten.

Beispiel: copy in `/n8n/packages/nodes-base/nodes/sophos-central`, dann `npm run build` und `npm run start`.

Credentials: Client ID + Client Secret (OAuth2 Client Credentials).

Support: Passe endpoints und Pfade an die aktuell dokumentierten Sophos Central APIs an.
```

---

## Hinweise & ToDos / Empfehlungen
- Sophos hat unterschiedliche API-Pfade (endpoint/v1, alert/v1, firewall/v1). Ich habe Platzhalter verwendet; überprüfe die genauen Pfade in der Developer-Doku.
- Rate-Limiting: Sophos hat Limits. Implementiere Backoff (retry) falls produktiv.
- Permissions: Client muss die passenden Rechte für die gewünschten Ressourcen besitzen.
- Tests: Erstelle Postman-Collection oder einfache curl-Tests um Endpoints zu verifizieren.
- Optional: Implementiere `loadOptions` für dynamische Dropdowns in n8n (z. B. Tenants, Endpoints). Das Pattern ist `methods.loadOptions` im Node.

---

Wenn du willst, generiere ich gleich:
- eine konkrete `loadOptions`-Implementierung für dynamische Dropdowns (Tenants, Endpoints)
- Retry- / Backoff-Logik
- eine ZIP-Datei mit allen Dateien

Sag mir, was ich als nächstes automatisch hinzufügen soll.

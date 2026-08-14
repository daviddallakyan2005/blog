# End-to-end tests

Public specs skip unless `PLAYWRIGHT_BASE_URL` or `PLAYWRIGHT_WEBSERVER=1` is set. Do not point Playwright at production.

Studio login is GitHub OAuth and is not automated. A real publish flow needs `E2E_OWNER_STORAGE_STATE` pointing at a Playwright `storageState` JSON file captured from a logged-in owner session (`npx playwright codegen --save-storage=e2e/.auth/owner.json`). Without that file, studio publish tests skip and CI stays green.

# Backend Module Template

Copy these files into `backend/src` and replace every `TODO_...` marker.

Expected structure for each member:
- `models/<Entity>.js`
- `validators/<entity>Validators.js`
- `controllers/<entity>Controller.js`
- `routes/<entity>Routes.js`

Rules:
- keep the shared response envelope: `success`, `message`, `data`
- use the shared validation middleware
- do not mount routes directly in `src/app.js`; ask the integration lead to do that

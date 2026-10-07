import {spawnSync} from 'node:child_process';
// Historical SQLite behavior is tested explicitly; it is disabled in the delivered cloud app.
const r=spawnSync(process.env.PYTHON||'python3',['-m','unittest','discover','-s','tests','-v'],{stdio:'inherit',env:{...process.env,VOLTEO_STORAGE:'sqlite'}});
process.exit(r.status??1);

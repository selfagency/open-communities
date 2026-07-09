// fallow-ignore-file unused-file -- auto-loaded by PocketBase at startup
// PocketBase JS Hook — Audit Logging
// Requires an "audit_logs" collection (see README for schema).
//
// IMPORTANT (PB 0.23+ JSVM):
// - Hook handlers must be plain non-async functions that call e.next() —
//   an async handler returns a Promise, which the JSVM rejects with
//   "the handler must a non-async function and not return a Promise".
// - The global app instance is $app, not app. There is no app.dao() /
//   `new Record(collection, data)` / txDao API anymore — use
//   $app.findCollectionByNameOrId(), `new Record(collection)`,
//   record.set(...), and $app.save(record).
// - Per "Handlers scope" in the PB JS docs, each handler runs in its own
//   isolated context and cannot see helpers declared at file scope, so
//   every helper used by a handler is declared inside that handler.

const AUDIT_COLLECTION = 'audit_logs';
const SKIP_COLLECTIONS = ['audit_logs', '_superusers', '_migrations', '_params', '_tokenKeys'];

// ---- Before-request events (have full request context: headers, IP, auth) ----

onRecordCreateRequest((e) => {
  function writeAuditLog() {
    const collectionName = e.collection?.name || '';
    if (SKIP_COLLECTIONS.includes(collectionName)) {
      return;
    }
    try {
      const collection = $app.findCollectionByNameOrId(AUDIT_COLLECTION);
      const logRecord = new Record(collection);
      logRecord.set('event_type', 'create_request');
      logRecord.set('collection_name', collectionName);
      logRecord.set('record_id', e.record?.id || '');
      logRecord.set('user', e.auth?.id || null);
      logRecord.set('request_ip', e.realIP());
      logRecord.set('request_url', e.request?.url?.path || '');
      logRecord.set('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);
      logRecord.set('after_changes', e.record ? e.record.publicExport() : null);
      $app.save(logRecord);
    } catch (err) {
      // Audit failures must never block the application
      console.error('Audit log error:', err.message);
    }
  }

  writeAuditLog();
  e.next();
});

onRecordUpdateRequest((e) => {
  function writeAuditLog() {
    const collectionName = e.collection?.name || '';
    if (SKIP_COLLECTIONS.includes(collectionName)) {
      return;
    }
    try {
      const collection = $app.findCollectionByNameOrId(AUDIT_COLLECTION);
      const logRecord = new Record(collection);
      logRecord.set('event_type', 'update_request');
      logRecord.set('collection_name', collectionName);
      logRecord.set('record_id', e.record?.id || '');
      logRecord.set('user', e.auth?.id || null);
      logRecord.set('request_ip', e.realIP());
      logRecord.set('request_url', e.request?.url?.path || '');
      logRecord.set('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);
      logRecord.set('before_changes', e.record ? e.record.original().publicExport() : null);
      logRecord.set('after_changes', e.record ? e.record.publicExport() : null);
      $app.save(logRecord);
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  }

  writeAuditLog();
  e.next();
});

onRecordDeleteRequest((e) => {
  function writeAuditLog() {
    const collectionName = e.collection?.name || '';
    if (SKIP_COLLECTIONS.includes(collectionName)) {
      return;
    }
    try {
      const collection = $app.findCollectionByNameOrId(AUDIT_COLLECTION);
      const logRecord = new Record(collection);
      logRecord.set('event_type', 'delete_request');
      logRecord.set('collection_name', collectionName);
      logRecord.set('record_id', e.record?.id || '');
      logRecord.set('user', e.auth?.id || null);
      logRecord.set('request_ip', e.realIP());
      logRecord.set('request_url', e.request?.url?.path || '');
      logRecord.set('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);
      logRecord.set('before_changes', e.record ? e.record.publicExport() : null);
      $app.save(logRecord);
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  }

  writeAuditLog();
  e.next();
});

// ---- After-success model events (persisted; no request context available) ----

onRecordAfterCreateSuccess((e) => {
  function writeAuditLog() {
    const collectionName = e.record?.collection()?.name || '';
    if (SKIP_COLLECTIONS.includes(collectionName)) {
      return;
    }
    try {
      const collection = $app.findCollectionByNameOrId(AUDIT_COLLECTION);
      const logRecord = new Record(collection);
      logRecord.set('event_type', 'create');
      logRecord.set('collection_name', collectionName);
      logRecord.set('record_id', e.record?.id || '');
      logRecord.set('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);
      logRecord.set('after_changes', e.record ? e.record.publicExport() : null);
      $app.save(logRecord);
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  }

  writeAuditLog();
  e.next();
});

onRecordAfterUpdateSuccess((e) => {
  function writeAuditLog() {
    const collectionName = e.record?.collection()?.name || '';
    if (SKIP_COLLECTIONS.includes(collectionName)) {
      return;
    }
    try {
      const collection = $app.findCollectionByNameOrId(AUDIT_COLLECTION);
      const logRecord = new Record(collection);
      logRecord.set('event_type', 'update');
      logRecord.set('collection_name', collectionName);
      logRecord.set('record_id', e.record?.id || '');
      logRecord.set('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);
      logRecord.set('after_changes', e.record ? e.record.publicExport() : null);
      $app.save(logRecord);
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  }

  writeAuditLog();
  e.next();
});

onRecordAfterDeleteSuccess((e) => {
  function writeAuditLog() {
    const collectionName = e.record?.collection()?.name || '';
    if (SKIP_COLLECTIONS.includes(collectionName)) {
      return;
    }
    try {
      const collection = $app.findCollectionByNameOrId(AUDIT_COLLECTION);
      const logRecord = new Record(collection);
      logRecord.set('event_type', 'delete');
      logRecord.set('collection_name', collectionName);
      logRecord.set('record_id', e.record?.id || '');
      logRecord.set('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);
      $app.save(logRecord);
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  }

  writeAuditLog();
  e.next();
});

// ---- Auth events ----

onRecordAuthWithOAuth2Request((e) => {
  function writeAuditLog() {
    const collectionName = e.collection?.name || '';
    if (SKIP_COLLECTIONS.includes(collectionName)) {
      return;
    }
    try {
      const collection = $app.findCollectionByNameOrId(AUDIT_COLLECTION);
      const logRecord = new Record(collection);
      logRecord.set('event_type', 'auth');
      logRecord.set('collection_name', collectionName);
      logRecord.set('record_id', e.record?.id || '');
      logRecord.set('user', e.record?.id || null);
      logRecord.set('request_ip', e.realIP());
      logRecord.set('request_url', e.request?.url?.path || '');
      logRecord.set('timestamp', new Date().toISOString().replace('T', ' ').split('.')[0]);
      logRecord.set('after_changes', { provider: e.providerName || '', method: 'oauth2' });
      $app.save(logRecord);
    } catch (err) {
      console.error('Audit auth log error:', err.message);
    }
  }

  writeAuditLog();
  e.next();
});

console.log('Audit logging hooks registered');

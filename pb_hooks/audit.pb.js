// PocketBase JS Hook — Audit Logging
// Place in pb_hooks/ directory. Creates an audit trail for all record operations.
// Requires an "audit_logs" collection (see README for schema).

const AUDIT_COLLECTION = 'audit_logs';
const SKIP_COLLECTIONS = new Set(['audit_logs', '_superusers', '_migrations', '_params', '_tokenKeys']);

function getClientIp(e) {
  return (
    e.http?.request?.headers?.get('cf-connecting-ip') ||
    e.http?.request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    e.http?.request?.headers?.get('x-real-ip') ||
    ''
  );
}

function getRequestUrl(e) {
  try {
    return e.http?.request?.url?.pathname || '';
  } catch {
    return '';
  }
}

function getUserId(e) {
  try {
    const auth = e.http?.request?.auth;
    return auth?.record?.id || null;
  } catch {
    return null;
  }
}

function now() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

async function logEvent(app, e, eventType, beforeState, afterState) {
  const collectionName = e.collection?.name || '';
  if (SKIP_COLLECTIONS.has(collectionName)) {
    return;
  }

  try {
    const recordId = e.record?.id || e.record?.getOriginal()?.id || '';

    await app.dao().runInTransaction(async (txDao) => {
      const logRecord = new Record(app.dao().findCollectionByNameOrId(AUDIT_COLLECTION), {
        event_type: eventType,
        collection_name: collectionName,
        record_id: recordId,
        user: getUserId(e),
        request_ip: getClientIp(e),
        request_url: getRequestUrl(e),
        timestamp: now(),
        before_changes: beforeState || null,
        after_changes: afterState || null
      });
      await txDao.saveRecord(logRecord);
    });
  } catch (err) {
    // Audit failures must never block the application
    console.error('Audit log error:', err.message);
  }
}

// ---- Before events (capture intent + before-state) ----

app.OnRecordBeforeCreateRequest().bind(async (e) => {
  await logEvent(app, e, 'create_request', null, e.record?.toExpanded() || null);
});

app.OnRecordBeforeUpdateRequest().bind(async (e) => {
  const before = e.record?.getOriginal()?.toExpanded() || null;
  await logEvent(app, e, 'update_request', before, e.record?.toExpanded() || null);
});

app.OnRecordBeforeDeleteRequest().bind(async (e) => {
  const before = e.record?.toExpanded() || null;
  await logEvent(app, e, 'delete_request', before, null);
});

// ---- After events (confirm commit) ----

app.OnRecordAfterCreateRequest().bind(async (e) => {
  await logEvent(app, e, 'create', null, e.record?.toExpanded() || null);
});

app.OnRecordAfterUpdateRequest().bind(async (e) => {
  await logEvent(app, e, 'update', null, e.record?.toExpanded() || null);
});

app.OnRecordAfterDeleteRequest().bind(async (e) => {
  await logEvent(app, e, 'delete', null, null);
});

// ---- Auth events ----

app.OnRecordAuthWithOAuth2Request().bind(async (e) => {
  try {
    const collectionName = e.collection?.name || '';
    if (SKIP_COLLECTIONS.has(collectionName)) {
      return;
    }

    await app.dao().runInTransaction(async (txDao) => {
      const logRecord = new Record(app.dao().findCollectionByNameOrId(AUDIT_COLLECTION), {
        event_type: 'auth',
        collection_name: collectionName,
        record_id: e.record?.id || '',
        user: e.record?.id || null,
        request_ip: getClientIp(e),
        request_url: getRequestUrl(e),
        timestamp: now(),
        after_changes: { provider: e.oAuth2Provider || '', method: 'oauth2' }
      });
      await txDao.saveRecord(logRecord);
    });
  } catch (err) {
    console.error('Audit auth log error:', err.message);
  }
});

console.log('Audit logging hooks registered');

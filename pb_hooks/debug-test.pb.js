// pb_hooks/debug-test.pb.js

console.log('DEBUG: PocketBase hook starting');

onModelCreate((e) => {
  console.log('DEBUG: onModelCreate hook fired for collection:', e.model.collectionId);
  console.log('DEBUG: Model data:', JSON.stringify(e.model));
  e.next();
}, '*'); // Listen to all collections

onRecordCreateRequest((e) => {
  console.log('DEBUG: onRecordCreateRequest fired');
  e.next();
});

console.log('DEBUG: PocketBase hook initialized');

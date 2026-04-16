# asansor.teknix.tech landing fix

This package includes:
- safer service worker registration
- cache version bump from `servisim-v1` to `servisim-v2`
- network-first navigation strategy
- stronger landing hero copy

## After deploy
On `asansor.teknix.tech` open Chrome DevTools → Application:
1. Service Workers → Unregister
2. Storage → Clear site data
3. Hard refresh

Or run in console:
```js
navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister()))).then(() => location.reload())
```

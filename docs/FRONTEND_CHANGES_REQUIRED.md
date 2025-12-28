# Frontend Changes Required

Backend changes have been made that require corresponding frontend updates.

---

## 1. Remove Premium/Highlight Features

**Principle: "All birds are equal"**

### Remove from Bird Cards/Profiles:
- [ ] Remove `⭐ Premium` badge
- [ ] Remove `🔥 Highlighted` label
- [ ] Remove special border/glow styling for premium birds
- [ ] Remove any "Boost this bird" or "Highlight for visibility" CTAs

### Remove from Story Components:
- [ ] Remove highlight toggle/button
- [ ] Remove pinned/highlighted story indicators
- [ ] Remove `isHighlighted` conditional rendering

### Remove Premium Subscription UI:
- [ ] Remove premium subscription pages/modals
- [ ] Remove premium plan selection
- [ ] Remove premium style customization
- [ ] Remove any upsell prompts for premium

### Code to search and remove:
```typescript
// Remove these patterns:
isPremium
isHighlighted
PremiumBadge
HighlightedStory
premium/subscribe
/premium/
bird.premium
story.highlighted
```

---

## 2. Update API Response Handling

### Birds List Pagination

**Old response:**
```json
[{ bird }, { bird }, ...]
```

**New response:**
```json
{
  "items": [{ bird }, { bird }, ...],
  "page": 1,
  "pageSize": 20,
  "totalCount": 30
}
```

### Update `bird.service.ts`:
```typescript
// Update getBirds to handle paginated response
export async function getBirds(page: number = 1, pageSize: number = 20) {
  const response = await api.get(`/birds?page=${page}&pageSize=${pageSize}`);
  return response.data; // { items, page, pageSize, totalCount }
}
```

### Update `birds/page.tsx`:
```typescript
// Access birds from items property
const birds = data?.items;

// Show "Load more" based on totalCount
const hasMore = data && data.totalCount > data.page * data.pageSize;
```

---

## 3. Birds Page is Now Public

The birds listing page no longer requires authentication.

### Already done in backend:
- `GET /api/birds` is public (no `[Authorize]` attribute)

### Already done in frontend:
- Removed `enabled: isAuthenticated` from query
- Removed redirect to login
- Removed auth guard

### Verify these work without login:
- [ ] `/birds` page loads without authentication
- [ ] Bird cards display correctly
- [ ] Search works without authentication
- [ ] "Load more" pagination works

---

## 4. QR Code Available to All Birds

Previously QR codes were premium-only. Now all birds can have QR codes.

### Endpoint changed:
- **Old:** `PATCH /api/birds/{id}/premium/qr` (required premium)
- **New:** `PATCH /api/birds/{id}/qr` (available to all bird owners)

### Update if you have QR upload UI:
```typescript
// Old
await api.patch(`/birds/${birdId}/premium/qr`, qrUrl);

// New
await api.patch(`/birds/${birdId}/qr`, qrUrl);
```

---

## 5. Invoice Emails (No Frontend Changes)

Backend now automatically sends invoice emails when payments complete:
- P2P payments → Email to sender
- Support intents (bird donations) → Email to supporter

**No frontend changes required** - this happens server-side.

---

## 6. Remove Premium-Related API Calls

### Endpoints Removed:
```
DELETE /api/birds/{id}/premium/subscribe
DELETE /api/birds/{id}/premium/subscribe/lifetime
DELETE /api/birds/{id}/premium/style
DELETE /api/premium/* (entire controller)
```

### Remove any calls to these endpoints from frontend.

---

## 7. Messaging Updates

### Replace any copy mentioning premium/highlighted:

**Remove:**
- "Premium birds get more exposure"
- "Highlight your story"
- "Upgrade to premium"
- "Boost visibility"

**Add (optional):**
- "Every bird on Wihngo deserves equal care and visibility"
- "All birds are equal"

---

## Testing Checklist

- [ ] Birds page loads without login
- [ ] No premium badges visible anywhere
- [ ] No highlight options on stories
- [ ] Pagination works with new response format
- [ ] No console errors about missing premium fields
- [ ] QR code upload works for any bird (if implemented)

---

## Questions?

If the backend response format doesn't match expectations, check:
1. Is the API running? `curl http://localhost:5162/api/birds?page=1&pageSize=20`
2. Check Network tab for actual response structure
3. Check for TypeScript type mismatches

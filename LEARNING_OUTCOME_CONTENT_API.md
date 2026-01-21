# Learning Outcome Content & Remedial APIs - Quick Reference

**Base URL:** `https://academic-7mkg.onrender.com`

---

## 📚 Learning Outcome Content APIs

### 1. Get Learning Outcome Content (View Content & Extracted Text)

**URL:** `GET https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Returns learning outcome with all contents (including extracted PDF text)

**Example:**
```javascript
const learningOutcomeId = "outcome_id_1";
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('Contents:', data.contents);
console.log('Extracted PDF text:', data.contents[0]?.text);
```

---

### 2. Add PDF Content (with Auto-Extraction)

**URL:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `type`: `"PDF"` or `"GBP_PDF"`
- `title`: Content title (string)
- `file`: PDF file (File object)

**Response:** Returns created content with `extractedTextLength` showing how many characters were extracted

**Example:**
```javascript
const formData = new FormData();
formData.append('type', 'PDF');
formData.append('title', 'Learning Outcome PDF');
formData.append('file', fileObject);

const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

### 3. Add Text Content

**URL:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "TEXT",
  "title": "Text Content",
  "text": "Full text content here..."
}
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'TEXT',
    title: 'Text Content',
    text: 'Full text content here...'
  })
});
```

---

### 4. Add PDF Content Manually (with URL)

**URL:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "PDF",
  "title": "Learning Outcome PDF",
  "url": "https://example.com/outcome.pdf",
  "text": "Optional: Manually entered text content"
}
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'PDF',
    title: 'Learning Outcome PDF',
    url: 'https://example.com/outcome.pdf',
    text: 'Optional manually entered text'
  })
});
```

---

### 5. Delete Learning Outcome Content

**URL:** `DELETE https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/content/:contentId`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID
- `contentId` (URL parameter): Content ID

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/content/${contentId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🎯 Learning Outcome Remedial APIs

### 6. Get Remedials for Learning Outcome

**URL:** `GET https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Returns array of remedial items (VIDEO, PDF, LINK)

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const remedials = await response.json();
```

---

### 7. Add Video Remedial (YouTube, etc.)

**URL:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "VIDEO",
  "title": "Video Tutorial",
  "content": "https://youtube.com/watch?v=..."
}
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'VIDEO',
    title: 'Video Tutorial',
    content: 'https://youtube.com/watch?v=...'
  })
});
```

---

### 8. Add PDF Remedial

**URL:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "PDF",
  "title": "Practice PDF",
  "content": "https://example.com/practice.pdf"
}
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'PDF',
    title: 'Practice PDF',
    content: 'https://example.com/practice.pdf'
  })
});
```

---

### 9. Add Link Remedial

**URL:** `POST https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "LINK",
  "title": "Reference Link",
  "content": "https://example.com/reference"
}
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'LINK',
    title: 'Reference Link',
    content: 'https://example.com/reference'
  })
});
```

---

### 10. Delete Remedial Content

**URL:** `DELETE https://academic-7mkg.onrender.com/api/admin/learning-outcomes/:learningOutcomeId/remedial/:remedialId`

**Parameters:**
- `learningOutcomeId` (URL parameter): Learning Outcome ID
- `remedialId` (URL parameter): Remedial ID

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcomes/${learningOutcomeId}/remedial/${remedialId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### 11. Delete Remedial (Alternative Endpoint)

**URL:** `DELETE https://academic-7mkg.onrender.com/api/admin/learning-outcome-remedials/:remedialId`

**Parameters:**
- `remedialId` (URL parameter): Remedial ID

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```javascript
const response = await fetch(`https://academic-7mkg.onrender.com/api/admin/learning-outcome-remedials/${remedialId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📋 Complete API Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/api/admin/learning-outcomes/:id/content` | View content & extracted text |
| 2 | POST | `/api/admin/learning-outcomes/:id/content` | Add PDF (with extraction) |
| 3 | POST | `/api/admin/learning-outcomes/:id/content` | Add TEXT content |
| 4 | POST | `/api/admin/learning-outcomes/:id/content` | Add PDF manually (URL) |
| 5 | DELETE | `/api/admin/learning-outcomes/:id/content/:contentId` | Delete content |
| 6 | GET | `/api/admin/learning-outcomes/:id/remedial` | Get remedials |
| 7 | POST | `/api/admin/learning-outcomes/:id/remedial` | Add VIDEO remedial |
| 8 | POST | `/api/admin/learning-outcomes/:id/remedial` | Add PDF remedial |
| 9 | POST | `/api/admin/learning-outcomes/:id/remedial` | Add LINK remedial |
| 10 | DELETE | `/api/admin/learning-outcomes/:id/remedial/:remedialId` | Delete remedial |
| 11 | DELETE | `/api/admin/learning-outcome-remedials/:remedialId` | Delete remedial (alt) |

---

## 🔑 Key Features

✅ **PDF Upload with Auto-Extraction**: Upload PDF files and text is automatically extracted  
✅ **Manual Text Entry**: Add text content directly without file upload  
✅ **Manual PDF Entry**: Add PDF by URL with optional manual text  
✅ **View Extracted Content**: Check extracted PDF text via GET endpoint  
✅ **Multiple Content Types**: Support PDF, GBP_PDF, and TEXT  
✅ **Remedial Support**: Add VIDEO, PDF, and LINK remedials  
✅ **Batch Operations**: Add multiple remedials sequentially  

---

## 📝 Notes

- PDF extraction happens automatically when uploading PDF files
- Extracted text is stored in the `text` field of content items
- You can view extracted text using the GET content endpoint
- Multiple content items can be added to the same learning outcome
- Remedials support YouTube videos, PDF documents, and external links
- All endpoints require Bearer token authentication

# Question Generation API - Frontend Documentation

## Base URL
```
https://academic-7mkg.onrender.com/api/admin
```

## Authentication
All endpoints require authentication via Bearer token:
```javascript
headers: {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
}
```

---

## 1. Generate Questions

Generate 10 MCQ questions for a specific tag and class level.

### Endpoint
```
POST /api/admin/questions/generate
```

### Request Example (JavaScript/TypeScript)
```javascript
const generateQuestions = async (tag, classLevel, topicName, azureConfig, options = {}) => {
  try {
    const response = await fetch('https://academic-7mkg.onrender.com/api/admin/questions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        tag: tag,
        classLevel: classLevel,
        topicName: topicName,
        concept: options.concept || null,
        type: options.type || 'SUBJECT',
        subjectId: options.subjectId || null,
        azureConfig: {
          endpoint: azureConfig.endpoint,
          apiKey: azureConfig.apiKey,
          deployment: azureConfig.deployment,
          apiVersion: azureConfig.apiVersion || '2024-02-01'
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Generated ${data.data.saved} questions`);
      return data;
    } else {
      throw new Error(data.message || 'Failed to generate questions');
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

// Usage
const azureConfig = {
  endpoint: 'https://your-azure-openai-endpoint.openai.azure.com',
  apiKey: 'your-azure-api-key-here',
  deployment: 'gpt-4o-2',
  apiVersion: '2024-02-01'
};

await generateQuestions(
  'Adds two- and three-digit numbers with and without regrouping',
  3,
  'Addition',
  azureConfig,
  {
    concept: 'Whole Number Addition',
    type: 'SUBJECT',
    subjectId: '507f1f77bcf86cd799439012'
  }
);
```

### Request Body
```typescript
interface GenerateQuestionRequest {
  tag: string;                    // Required: The tag/learning outcome
  classLevel: number;             // Required: Class level (3, 4, 5, etc.)
  topicName: string;              // Required: Topic name (e.g., "Addition")
  concept?: string;                // Optional: Concept name
  type?: 'SUBJECT' | 'BASIC_CALCULATION';  // Optional: Default 'SUBJECT'
  subjectId?: string | null;       // Optional: Required for SUBJECT type
  azureConfig: {                   // Required: Azure OpenAI configuration
    endpoint: string;
    apiKey: string;
    deployment: string;
    apiVersion?: string;           // Optional: Default '2024-02-01'
  };
}
```

### Response
```typescript
interface GenerateQuestionResponse {
  success: boolean;
  message: string;
  data: {
    batchId: string;
    totalGenerated: number;
    valid: number;
    corrected: number;
    invalid: number;
    saved: number;
    questions: Array<{
      _id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      difficulty: 'easy' | 'medium' | 'hard';
      status: 'pending';
    }>;
  };
}
```

### Example Response
```json
{
  "success": true,
  "message": "Generated 8 questions",
  "data": {
    "batchId": "batch_1234567890_abc123",
    "totalGenerated": 10,
    "valid": 7,
    "corrected": 1,
    "invalid": 2,
    "saved": 8,
    "questions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "question": "What is the sum of 234 and 567?",
        "options": ["801", "791", "821", "831"],
        "correctAnswer": 1,
        "difficulty": "medium",
        "status": "pending"
      }
    ]
  }
}
```

---

## 2. Get All Questions (List)

Retrieve questions with filters and pagination.

### Endpoint
```
GET /api/admin/questions
```

### Request Example (JavaScript/TypeScript)
```javascript
const getQuestions = async (filters = {}, pagination = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.classLevel) params.append('classLevel', filters.classLevel);
    if (filters.topicName) params.append('topicName', filters.topicName);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    
    // Add pagination
    params.append('limit', pagination.limit || 50);
    params.append('skip', pagination.skip || 0);
    
    const response = await fetch(
      `https://academic-7mkg.onrender.com/api/admin/questions?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch questions');
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Usage examples

// 1. Get ALL questions (no status filter)
const allQuestions = await getQuestions({}, { limit: 50, skip: 0 });

// 2. Get only APPROVED questions
const approvedQuestions = await getQuestions({ 
  status: 'approved' 
});

// 3. Get only PENDING questions (awaiting approval)
const pendingQuestions = await getQuestions({ 
  status: 'pending' 
});

// 4. Get only REJECTED questions
const rejectedQuestions = await getQuestions({ 
  status: 'rejected' 
});

// 5. Get approved questions for a specific topic
const approvedTopicQuestions = await getQuestions({
  topicName: 'Addition',
  status: 'approved'
});

// 6. Get pending questions for a specific tag and class
const pendingTagQuestions = await getQuestions({
  tag: 'Adds two- and three-digit numbers',
  classLevel: 3,
  status: 'pending'
}, { limit: 100, skip: 0 });

// 7. Get all questions for a class (all statuses)
const classQuestions = await getQuestions({
  classLevel: 3
});

// 8. Get approved questions for a specific class and topic
const approvedClassTopicQuestions = await getQuestions({
  classLevel: 3,
  topicName: 'Addition',
  status: 'approved'
});
```

### Query Parameters
```typescript
interface QuestionFilters {
  tag?: string;
  classLevel?: number;
  topicName?: string;
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'SUBJECT' | 'BASIC_CALCULATION';
  subjectId?: string;
  limit?: number;    // Default: 50
  skip?: number;     // Default: 0
}
```

### Response
```typescript
interface GetQuestionsResponse {
  success: boolean;
  data: {
    questions: Array<{
      _id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      finalAnswer: string;
      difficulty: 'easy' | 'medium' | 'hard';
      classLevel: number;
      topicName: string;
      concept?: string;
      tag: string;
      latex: boolean;
      status: 'pending' | 'approved' | 'rejected';
      generationBatch: string;
      type: string;
      subjectId?: string;
      createdAt: string;
      updatedAt: string;
      approvedBy?: {
        _id: string;
        name: string;
        email: string;
      };
      rejectedBy?: {
        _id: string;
        name: string;
        email: string;
      };
      rejectionReason?: string;
    }>;
    total: number;
    limit: number;
    skip: number;
  };
}
```

---

## 3. Approve Question

Approve a single question (changes status from 'pending' to 'approved').

### Endpoint
```
PUT /api/admin/questions/:questionId/approve
```

### Request Example (JavaScript/TypeScript)
```javascript
const approveQuestion = async (questionId) => {
  try {
    const response = await fetch(
      `https://academic-7mkg.onrender.com/api/admin/questions/${questionId}/approve`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Question approved');
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to approve question');
    }
  } catch (error) {
    console.error('Error approving question:', error);
    throw error;
  }
};

// Usage
await approveQuestion('507f1f77bcf86cd799439011');
```

### Response
```typescript
interface ApproveQuestionResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    question: string;
    status: 'approved';
    approvedBy: string;
    approvedAt: string;
    // ... other question fields
  };
}
```

---

## 4. Reject Question

Reject a single question (changes status from 'pending' to 'rejected').

### Endpoint
```
PUT /api/admin/questions/:questionId/reject
```

### Request Example (JavaScript/TypeScript)
```javascript
const rejectQuestion = async (questionId, reason) => {
  try {
    const response = await fetch(
      `https://academic-7mkg.onrender.com/api/admin/questions/${questionId}/reject`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          reason: reason || 'No reason provided'
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('❌ Question rejected');
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to reject question');
    }
  } catch (error) {
    console.error('Error rejecting question:', error);
    throw error;
  }
};

// Usage
await rejectQuestion('507f1f77bcf86cd799439011', 'Incorrect answer option');
```

### Request Body
```typescript
interface RejectQuestionRequest {
  reason?: string;  // Optional: Rejection reason
}
```

### Response
```typescript
interface RejectQuestionResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    question: string;
    status: 'rejected';
    rejectedBy: string;
    rejectedAt: string;
    rejectionReason: string;
    // ... other question fields
  };
}
```

---

## 5. Bulk Approve Questions

Approve multiple questions at once.

### Endpoint
```
PUT /api/admin/questions/bulk-approve
```

### Request Example (JavaScript/TypeScript)
```javascript
const bulkApproveQuestions = async (questionIds) => {
  try {
    const response = await fetch(
      'https://academic-7mkg.onrender.com/api/admin/questions/bulk-approve',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          questionIds: questionIds
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Approved ${data.data.approved} questions`);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to approve questions');
    }
  } catch (error) {
    console.error('Error bulk approving questions:', error);
    throw error;
  }
};

// Usage
await bulkApproveQuestions([
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013'
]);
```

### Request Body
```typescript
interface BulkApproveRequest {
  questionIds: string[];
}
```

### Response
```typescript
interface BulkApproveResponse {
  success: boolean;
  message: string;
  data: {
    approved: number;
    total: number;
  };
}
```

---

## 6. Bulk Reject Questions

Reject multiple questions at once.

### Endpoint
```
PUT /api/admin/questions/bulk-reject
```

### Request Example (JavaScript/TypeScript)
```javascript
const bulkRejectQuestions = async (questionIds, reason) => {
  try {
    const response = await fetch(
      'https://academic-7mkg.onrender.com/api/admin/questions/bulk-reject',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          questionIds: questionIds,
          reason: reason || 'Quality issues'
        })
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log(`❌ Rejected ${data.data.rejected} questions`);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to reject questions');
    }
  } catch (error) {
    console.error('Error bulk rejecting questions:', error);
    throw error;
  }
};

// Usage
await bulkRejectQuestions(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  'Questions need revision'
);
```

### Request Body
```typescript
interface BulkRejectRequest {
  questionIds: string[];
  reason?: string;
}
```

### Response
```typescript
interface BulkRejectResponse {
  success: boolean;
  message: string;
  data: {
    rejected: number;
    total: number;
  };
}
```

---

## Complete Example: Question Management Workflow

```javascript
// Complete workflow example
class QuestionManager {
  constructor(adminToken, azureConfig) {
    this.adminToken = adminToken;
    this.azureConfig = azureConfig;
    this.baseUrl = 'https://academic-7mkg.onrender.com/api/admin';
  }

  async generateQuestions(tag, classLevel, topicName, options = {}) {
    const response = await fetch(`${this.baseUrl}/questions/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.adminToken}`
      },
      body: JSON.stringify({
        tag,
        classLevel,
        topicName,
        concept: options.concept,
        type: options.type || 'SUBJECT',
        subjectId: options.subjectId,
        azureConfig: this.azureConfig
      })
    });
    return await response.json();
  }

  async getQuestions(filters = {}, pagination = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    params.append('limit', pagination.limit || 50);
    params.append('skip', pagination.skip || 0);

    const response = await fetch(
      `${this.baseUrl}/questions?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      }
    );
    return await response.json();
  }

  async approveQuestion(questionId) {
    const response = await fetch(
      `${this.baseUrl}/questions/${questionId}/approve`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      }
    );
    return await response.json();
  }

  async rejectQuestion(questionId, reason) {
    const response = await fetch(
      `${this.baseUrl}/questions/${questionId}/reject`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        },
        body: JSON.stringify({ reason })
      }
    );
    return await response.json();
  }

  async bulkApprove(questionIds) {
    const response = await fetch(`${this.baseUrl}/questions/bulk-approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.adminToken}`
      },
      body: JSON.stringify({ questionIds })
    });
    return await response.json();
  }

  async bulkReject(questionIds, reason) {
    const response = await fetch(`${this.baseUrl}/questions/bulk-reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.adminToken}`
      },
      body: JSON.stringify({ questionIds, reason })
    });
    return await response.json();
  }
}

// Usage
const manager = new QuestionManager(adminToken, {
  endpoint: 'https://your-azure-openai-endpoint.openai.azure.com',
  apiKey: 'your-azure-api-key-here',
  deployment: 'gpt-4o-2',
  apiVersion: '2024-02-01'
});

// Generate questions
const result = await manager.generateQuestions(
  'Adds two- and three-digit numbers with and without regrouping',
  3,
  'Addition',
  { concept: 'Whole Number Addition', type: 'SUBJECT' }
);

// Get pending questions
const pending = await manager.getQuestions({ status: 'pending' });

// Approve questions
for (const question of pending.data.questions) {
  await manager.approveQuestion(question._id);
}
```

---

## Error Handling

All endpoints may return errors:

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
```

### Common Error Codes
- `400` - Bad Request (missing required fields, invalid Azure config)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (question ID not found)
- `500` - Internal Server Error

### Error Handling Example
```javascript
try {
  const result = await generateQuestions(tag, classLevel, topicName, azureConfig);
  if (!result.success) {
    // Handle API error
    console.error('API Error:', result.message);
  }
} catch (error) {
  // Handle network or other errors
  console.error('Request failed:', error);
}
```

---

## Notes

1. **Azure Configuration**: Azure credentials must be provided in each generation request. Store them securely in your frontend (environment variables, secure storage, etc.)

2. **Question Status**: 
   - `pending` - Newly generated, awaiting approval
   - `approved` - Approved by admin, ready for use
   - `rejected` - Rejected by admin, not to be used

3. **Duplicate Prevention**: The system automatically prevents duplicate questions for the same tag and class level.

4. **Batch ID**: Each generation creates a unique batch ID that can be used to track questions generated together.

5. **Pagination**: Use `limit` and `skip` for pagination when fetching large lists of questions.

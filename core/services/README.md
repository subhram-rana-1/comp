# API Service Documentation

## Overview
This directory contains API service classes for communicating with backend servers.

## ApiService Class

### Configuration

The base URL for all API calls is configured in a single location:

```javascript
// In ApiService.js
static BASE_URL = 'https://caten-production.up.railway.app';
```

### Changing the Base URL

To update the API base URL, you have two options:

1. **Edit the default value** in `ApiService.js`:
```javascript
static BASE_URL = 'https://your-production-server.com';
```

2. **Update at runtime**:
```javascript
ApiService.setBaseUrl('https://your-production-server.com');
```

### Available Methods

#### `ask({ initial_context, chat_history, question })`

Sends a question to the AI backend with context and chat history.

**Parameters:**
- `initial_context` (string): The original selected text that provides context
- `chat_history` (array): Array of previous chat messages in format:
  ```javascript
  [
    { role: 'user', content: 'Question 1' },
    { role: 'assistant', content: 'Answer 1' }
  ]
  ```
- `question` (string): The user's current question

**Returns:**
```javascript
{
  success: true,
  data: { /* API response object */ }
}
// or
{
  success: false,
  error: 'Error message'
}
```

**Example Usage:**
```javascript
const response = await ApiService.ask({
  initial_context: "The text the user selected...",
  chat_history: [
    { role: 'user', content: 'What is this about?' },
    { role: 'assistant', content: 'This is about...' }
  ],
  question: 'Can you explain more?'
});

if (response.success) {
  console.log('AI Response:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### API Endpoint

- **Endpoint**: `POST /api/v2/ask`
- **Headers**: `Content-Type: application/json`
- **Credentials**: Includes cookies (JSESSIONID)

### Future API Methods

This class is designed to be extended with additional API methods as needed. Follow the same pattern:

```javascript
static async yourNewMethod(params) {
  const url = `${this.BASE_URL}${this.ENDPOINTS.YOUR_ENDPOINT}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params)
    });
    
    // Handle response...
  } catch (error) {
    // Handle error...
  }
}
```

## Error Handling

All API methods include comprehensive error handling and logging. Check the browser console for detailed logs:
- `[ApiService] Sending request to:` - Shows the URL being called
- `[ApiService] Request body:` - Shows the payload
- `[ApiService] Response received:` - Shows the response data
- `[ApiService] Error calling ask API:` - Shows any errors

## CORS Considerations

If you encounter CORS errors, ensure your backend server:
1. Allows requests from the Chrome extension origin
2. Supports credentials (cookies)
3. Has appropriate CORS headers configured


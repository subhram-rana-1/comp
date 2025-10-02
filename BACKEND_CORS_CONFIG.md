# Backend CORS Configuration Guide

## The Problem
Your Chrome extension content script runs on various websites (like `https://www.nytimes.com`) and tries to call your API at `http://localhost:8000`. This is a cross-origin request that requires proper CORS configuration.

## Required Backend Changes

### For Spring Boot (Java)

Add this CORS configuration class:

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")  // Allows all origins
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)  // Allow cookies
                .maxAge(3600);
    }
}
```

**OR** add these annotations to your controller:

```java
@RestController
@RequestMapping("/api/v2")
@CrossOrigin(
    originPatterns = "*",
    allowCredentials = "true",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class YourController {
    
    @PostMapping("/ask")
    public ResponseEntity<?> ask(@RequestBody AskRequest request) {
        // your code
    }
}
```

### For Express.js (Node.js)

Install the CORS package:
```bash
npm install cors
```

Add this configuration:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Allow all origins for development
    callback(null, true);
  },
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Your routes
app.post('/api/v2/ask', (req, res) => {
  // your code
});
```

### For Flask (Python)

Install Flask-CORS:
```bash
pip install flask-cors
```

Add this configuration:

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# CORS configuration
CORS(app, 
     origins="*",  # Allow all origins
     supports_credentials=True,  # Allow cookies
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

@app.route('/api/v2/ask', methods=['POST'])
def ask():
    # your code
    pass
```

### For Django (Python)

Install django-cors-headers:
```bash
pip install django-cors-headers
```

Add to `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Add this at the top
    'django.middleware.common.CommonMiddleware',
    # ...
]

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # For development
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

## Key Points

1. **Allow Credentials**: Must be set to `true` to allow cookies (JSESSIONID)
2. **Origin Pattern**: Use `allowedOriginPatterns("*")` or `origins="*"` for development to allow all origins
3. **For Production**: Restrict origins to specific domains for security
4. **OPTIONS Method**: Make sure OPTIONS (preflight) requests are handled

## Testing CORS Configuration

You can test if CORS is configured correctly using curl:

```bash
# Test preflight request
curl -X OPTIONS http://localhost:8000/api/v2/ask \
  -H "Origin: https://www.nytimes.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Test actual request
curl -X POST http://localhost:8000/api/v2/ask \
  -H "Origin: https://www.nytimes.com" \
  -H "Content-Type: application/json" \
  -d '{"initial_context":"test","chat_history":[],"question":"test"}' \
  -v
```

Look for these headers in the response:
- `Access-Control-Allow-Origin: https://www.nytimes.com` (or the requesting origin)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, ...`

## After Configuring Backend

Once you've added the CORS configuration to your backend:
1. Restart your backend server
2. Reload the Chrome extension
3. Try the chat feature again

The extension should now be able to communicate with your API server successfully!


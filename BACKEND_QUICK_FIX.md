# Quick CORS Fix for Your Backend

## The Issue
You can call the API with `curl` but not from the Chrome extension because browsers enforce CORS security.

## Quick Test (Spring Boot)

### Option 1: Add to your Controller (Easiest)

Add this to your controller class:

```java
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2")
@CrossOrigin(
    originPatterns = {"*"},
    allowCredentials = "true",
    methods = {RequestMethod.POST, RequestMethod.GET, RequestMethod.OPTIONS}
)
public class AskController {
    
    @PostMapping("/ask")
    public ResponseEntity<?> ask(@RequestBody AskRequest request, HttpServletRequest httpRequest) {
        // Your existing code
        return ResponseEntity.ok(response);
    }
}
```

### Option 2: Global CORS Configuration

Create a new file `WebConfig.java`:

```java
package com.yourpackage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class WebConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");  // Allow all origins
        config.addAllowedHeader("*");         // Allow all headers
        config.addAllowedMethod("*");         // Allow all methods
        
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
```

### Option 3: Quick application.properties Fix

Add these lines to `application.properties` or `application.yml`:

**application.properties:**
```properties
# CORS Configuration
spring.web.cors.allowed-origin-patterns=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true
```

## Verify CORS is Working

After adding the configuration and restarting your server, test with this command:

```bash
curl -X OPTIONS https://caten-production.up.railway.app/api/v2/ask \
  -H "Origin: https://www.nytimes.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i
```

**You should see these headers in the response:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://www.nytimes.com
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Content-Type
```

## Common Mistakes

❌ **Don't do this:**
```java
@CrossOrigin(origins = "*", allowCredentials = "true")  // WRONG! Can't use * with credentials
```

✅ **Do this instead:**
```java
@CrossOrigin(originPatterns = "*", allowCredentials = "true")  // CORRECT! Use originPatterns
```

## Still Not Working?

If CORS is still not working, check:

1. **Server is running**: `curl https://caten-production.up.railway.app/api/v2/ask` should respond
2. **No proxy/firewall**: Make sure nothing is blocking localhost
3. **Check console logs**: Your backend should log CORS-related errors
4. **Spring Boot version**: Make sure you're using Spring Boot 2.4+ (for `originPatterns` support)

## After Fixing CORS

1. ✅ Restart your backend server
2. ✅ Reload your Chrome extension (`chrome://extensions` → click reload)
3. ✅ Hard refresh the webpage (Ctrl+Shift+R or Cmd+Shift+R)
4. ✅ Try asking a question in the chat

The extension should now work! 🎉


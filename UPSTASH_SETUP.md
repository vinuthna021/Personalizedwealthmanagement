# Upstash Redis Production Setup Guide

This guide details the integration steps, connection security, and connection validation commands for deploying **Upstash Serverless Redis** as the caching engine and Celery broker.

---

## 1. Upstash Redis URL Format

Upstash Redis requires TLS (Transport Layer Security) in production. You must use the `rediss://` schema instead of `redis://` to encrypt data in transit:

```
rediss://default:<password>@<upstash-host>.upstash.io:<port>
```

---

## 2. Production Environment Variable Setup

Expose the cache connection string to the Render backend service by setting `REDIS_URL` in the Render dashboard environment configs:

```env
REDIS_URL=rediss://default:your_upstash_secret_token@cool-redis-instance.upstash.io:6379
```

---

## 3. Connection Verification Script

To verify that the API server or your local environment can successfully authenticate and connect to the Upstash Redis instance, execute this quick python check:

```python
import redis

# Replace with your actual Upstash REDIS_URL
redis_url = "rediss://default:your_upstash_secret_token@cool-redis-instance.upstash.io:6379"

try:
    client = redis.from_url(redis_url, decode_responses=True)
    ping_response = client.ping()
    print(f"Connection Successful! Ping response: {ping_response}")
except Exception as e:
    print(f"Connection Failed: {e}")
```

Run the validation command:
```bash
python -c "import redis; r = redis.from_url('$REDIS_URL'); print('Connected:', r.ping())"
```

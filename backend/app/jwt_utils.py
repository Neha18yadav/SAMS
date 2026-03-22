import base64
import json
import hmac
import hashlib
import time

def base64url_encode(data):
    return base64.urlsafe_b64encode(data).replace(b'=', b'')

def base64url_decode(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    data += b'=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data)

def encode(payload, secret_key):
    header = {"alg": "HS256", "typ": "JWT"}
    header_enc = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_enc = base64url_encode(json.dumps(payload).encode('utf-8'))
    
    signature_input = header_enc + b'.' + payload_enc
    if isinstance(secret_key, str):
        secret_key = secret_key.encode('utf-8')
        
    signature = hmac.new(secret_key, signature_input, hashlib.sha256).digest()
    signature_enc = base64url_encode(signature)
    
    return (header_enc + b'.' + payload_enc + b'.' + signature_enc).decode('utf-8')

def decode(token, secret_key):
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT token format")
        
    header_enc, payload_enc, signature_enc = parts
    signature_input = (header_enc + '.' + payload_enc).encode('utf-8')
    
    if isinstance(secret_key, str):
        secret_key = secret_key.encode('utf-8')
        
    expected_signature = hmac.new(secret_key, signature_input, hashlib.sha256).digest()
    expected_signature_enc = base64url_encode(expected_signature).decode('utf-8')
    
    if not hmac.compare_digest(signature_enc, expected_signature_enc):
        raise ValueError("Invalid JWT signature")
        
    payload = json.loads(base64url_decode(payload_enc).decode('utf-8'))
    if 'exp' in payload:
        if payload['exp'] < time.time():
            raise ValueError("Token expired")
            
    return payload

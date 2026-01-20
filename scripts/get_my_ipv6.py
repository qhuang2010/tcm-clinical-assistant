import urllib.request
import socket

try:
    print("Attempting to get public IPv6...")
    with urllib.request.urlopen('https://api64.ipify.org', timeout=5) as response:
        print(f"Public IPv6: {response.read().decode('utf-8')}")
except Exception as e:
    print(f"Could not get public IPv6: {e}")

print("\nLocal Interface IPv6 addresses:")
try:
    # Get all addresses
    infos = socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET6)
    seen = set()
    for info in infos:
        ip = info[4][0]
        if ip not in seen and not ip.startswith('fe80'): # Filter link-local
            print(f" - {ip}")
            seen.add(ip)
except Exception as e:
    print(f"Error listing local IPs: {e}")

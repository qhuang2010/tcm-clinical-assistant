import socket
import sys
import time

host = "2406:da1c:f42:ae0c:403e:57d3:81d5:813"
port = 5432

print(f"Testing TCP connection to [{host}]:{port} ...")

try:
    s = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    s.settimeout(10) # 10 seconds
    try:
        s.connect((host, port))
        print("Success! Socket connected.")
    except socket.timeout:
        print("Connection timed out.")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        s.close()
except Exception as e:
    print(f"Setup failed: {e}")

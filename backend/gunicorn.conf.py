"""
Gunicorn configuration for ResuMatch AI Backend
Optimized for DigitalOcean App Platform
"""
import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '8080')}"
backlog = 2048

# Worker processes
workers = int(os.environ.get('GUNICORN_WORKERS', 2))
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

# Restart workers after processing this many requests (helps prevent memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = 'resumatch-ai'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = None
certfile = None

# Preload app for faster worker spawning
preload_app = True

# Graceful timeout for worker restart
graceful_timeout = 30

def on_starting(server):
    """Called just before the master process is initialized."""
    print("=" * 60)
    print("🚀 Starting ResuMatch AI Backend with Gunicorn")
    print("=" * 60)

def when_ready(server):
    """Called just after the server is started."""
    print(f"✅ Server ready - Workers: {workers}, Port: {bind}")

def on_reload(server):
    """Called when a worker is reloaded."""
    print("🔄 Reloading workers...")

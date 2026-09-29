"""
PC Assist backend.

Reads live information from the computer it is running on and serves it as
JSON on http://127.0.0.1:9140 for the PC Assist front end.

Nothing here is hardcoded about a particular machine: CPU, memory, disk,
network and device details are all read from the operating system when the
program runs, so the same folder works on any computer.

Run:  python main.py
"""

import ctypes
import json
import os
import platform
import socket
import subprocess
import threading
import time
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path

import psutil
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

APP_VERSION = "1.0.0"
HOST = "127.0.0.1"
PORT = 9140
HISTORY_SECONDS = 60
IS_WINDOWS = os.name == "nt"
SYSTEM_DRIVE = (os.environ.get("SystemDrive", "C:") + "\\") if IS_WINDOWS else "/"

# --------------------------------------------------------------------------
# Live samples (filled once a second by the sampler thread)
# --------------------------------------------------------------------------

lock = threading.Lock()
history = {
    name: deque(maxlen=HISTORY_SECONDS)
    for name in ("cpu", "memory", "disk_active", "disk_read", "disk_write", "net_send", "net_recv")
}
live = {
    "cpu": 0.0,
    "speed_mhz": None,
    "processes": None,
    "threads": None,
    "disk_active": 0.0,
    "disk_response_ms": 0.0,
    "disk_read": 0.0,
    "disk_write": 0.0,
    "net_iface": None,
    "net_send": 0.0,
    "net_recv": 0.0,
}

# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

cache_store = {}
cache_lock = threading.Lock()


def cached(key, ttl_seconds, fn):
    """Return fn() but reuse the last result for ttl_seconds."""
    now = time.time()
    with cache_lock:
        hit = cache_store.get(key)
        if hit and now - hit[0] < ttl_seconds:
            return hit[1]
    value = fn()
    with cache_lock:
        cache_store[key] = (time.time(), value)
    return value


def run_powershell(script, timeout=10):
    """Run a PowerShell snippet and return its text output, or None."""
    if not IS_WINDOWS:
        return None
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        text = out.stdout.strip()
        return text or None
    except Exception:
        return None


def run_command(args, timeout=5):
    try:
        out = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=subprocess.CREATE_NO_WINDOW if IS_WINDOWS else 0,
        )
        return out.stdout
    except Exception:
        return None


def read_text(path):
    try:
        return Path(path).read_text().strip() or None
    except Exception:
        return None


# --------------------------------------------------------------------------
# Device information (read once, cached)
# --------------------------------------------------------------------------

def cpu_name():
    def read():
        if IS_WINDOWS:
            try:
                import winreg

                key = winreg.OpenKey(
                    winreg.HKEY_LOCAL_MACHINE,
                    r"HARDWARE\DESCRIPTION\System\CentralProcessor\0",
                )
                value, _ = winreg.QueryValueEx(key, "ProcessorNameString")
                return value.strip()
            except Exception:
                return platform.processor() or None
        if platform.system() == "Darwin":
            out = run_command(["sysctl", "-n", "machdep.cpu.brand_string"])
            return out.strip() if out else None
        try:
            for line in Path("/proc/cpuinfo").read_text().splitlines():
                if line.lower().startswith("model name"):
                    return line.split(":", 1)[1].strip()
        except Exception:
            pass
        return platform.processor() or None

    return cached("cpu_name", 3600, read)


def device_info():
    def read():
        info = {"manufacturer": None, "model": None, "serial": None}
        if IS_WINDOWS:
            out = run_powershell(
                "$b=Get-CimInstance Win32_BIOS; $c=Get-CimInstance Win32_ComputerSystem; "
                "[pscustomobject]@{Serial=$b.SerialNumber; Manufacturer=$c.Manufacturer; Model=$c.Model} "
                "| ConvertTo-Json -Compress"
            )
            if out:
                try:
                    data = json.loads(out)
                    info["serial"] = data.get("Serial")
                    info["manufacturer"] = data.get("Manufacturer")
                    info["model"] = data.get("Model")
                except ValueError:
                    pass
        elif platform.system() == "Linux":
            info["manufacturer"] = read_text("/sys/class/dmi/id/sys_vendor")
            info["model"] = read_text("/sys/class/dmi/id/product_name")
            info["serial"] = read_text("/sys/class/dmi/id/product_serial")
        return info

    return cached("device_info", 3600, read)


def system_disk_info():
    """Which physical disk holds the system drive, plus its model and type."""

    def read():
        info = {"number": None, "model": None, "type": None, "size": None}
        if not IS_WINDOWS:
            return info
        out = run_powershell(
            "$n=(Get-Partition -DriveLetter $env:SystemDrive.Substring(0,1) | Get-Disk).Number; "
            "$d=Get-PhysicalDisk | Where-Object { $_.DeviceId -eq $n }; "
            "[pscustomobject]@{Number=$n; Model=$d.FriendlyName; Media=$d.MediaType; "
            "Bus=$d.BusType; Size=$d.Size} | ConvertTo-Json -Compress"
        )
        if not out:
            return info
        try:
            data = json.loads(out)
        except ValueError:
            return info
        media = data.get("Media")
        bus = data.get("Bus")
        media = None if media in (None, "", "Unspecified") else media
        if media and bus:
            kind = f"{media} ({bus})"
        else:
            kind = media or bus
        info.update(number=data.get("Number"), model=data.get("Model"), type=kind, size=data.get("Size"))
        return info

    return cached("system_disk", 3600, read)


# --------------------------------------------------------------------------
# Network helpers
# --------------------------------------------------------------------------

def primary_interface():
    """Name of the adapter the computer uses to reach the network."""
    ip = None
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))  # no traffic is sent, this only picks a route
        ip = sock.getsockname()[0]
        sock.close()
    except OSError:
        pass
    addrs = psutil.net_if_addrs()
    if ip:
        for name, entries in addrs.items():
            for entry in entries:
                if entry.family == socket.AF_INET and entry.address == ip:
                    return name
    stats = psutil.net_if_stats()
    for name, entries in addrs.items():
        if name in stats and stats[name].isup:
            for entry in entries:
                if (
                    entry.family == socket.AF_INET
                    and not entry.address.startswith(("127.", "169.254."))
                ):
                    return name
    return None


def parse_netsh(text):
    blocks = []
    current = None
    for line in text.splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip().lower()
        value = value.strip()
        if key == "name":
            current = {}
            blocks.append(current)
        if current is not None:
            current[key] = value
    return blocks


def wifi_details(iface):
    """SSID, radio type and adapter description when iface is a Wi-Fi adapter."""

    def read():
        if not IS_WINDOWS:
            return None
        text = run_command(["netsh", "wlan", "show", "interfaces"])
        if not text:
            return None
        for block in parse_netsh(text):
            if block.get("name") == iface:
                return {
                    "description": block.get("description"),
                    "ssid": block.get("ssid"),
                    "radio": block.get("radio type"),
                }
        return None

    return cached(f"wifi:{iface}", 15, read)


def dns_servers(iface):
    def read():
        if IS_WINDOWS:
            alias = iface.replace("'", "''")
            out = run_powershell(
                f"(Get-DnsClientServerAddress -InterfaceAlias '{alias}').ServerAddresses -join ','"
            )
            return [s for s in (out or "").split(",") if s]
        servers = []
        text = read_text("/etc/resolv.conf") or ""
        for line in text.splitlines():
            if line.strip().startswith("nameserver"):
                parts = line.split()
                if len(parts) > 1:
                    servers.append(parts[1])
        return servers

    return cached(f"dns:{iface}", 20, read)


def interface_addresses(iface):
    ipv4 = None
    ipv6_global = None
    ipv6_local = None
    for entry in psutil.net_if_addrs().get(iface, []):
        if entry.family == socket.AF_INET and not ipv4:
            ipv4 = entry.address
        elif entry.family == socket.AF_INET6:
            address = entry.address.split("%")[0]
            if address.lower().startswith("fe80"):
                ipv6_local = ipv6_local or address
            else:
                ipv6_global = ipv6_global or address
    return ipv4, ipv6_global or ipv6_local


# --------------------------------------------------------------------------
# Disk helpers
# --------------------------------------------------------------------------

def read_disk_counters():
    """Cumulative counters for the system disk (or all disks if unknown)."""
    number = system_disk_info().get("number")
    counters = None
    if IS_WINDOWS and number is not None:
        per_disk = psutil.disk_io_counters(perdisk=True) or {}
        counters = per_disk.get(f"PhysicalDrive{number}")
    if counters is None:
        counters = psutil.disk_io_counters()
    if counters is None:
        return None
    return {
        "read_bytes": counters.read_bytes,
        "write_bytes": counters.write_bytes,
        "read_count": counters.read_count,
        "write_count": counters.write_count,
        "read_time": counters.read_time,
        "write_time": counters.write_time,
        "busy_time": getattr(counters, "busy_time", None),
    }


def volume_label(mountpoint):
    if not IS_WINDOWS:
        return None
    try:
        buffer = ctypes.create_unicode_buffer(261)
        ok = ctypes.windll.kernel32.GetVolumeInformationW(
            ctypes.c_wchar_p(mountpoint), buffer, 261, None, None, None, None, 0
        )
        return buffer.value if ok and buffer.value else None
    except Exception:
        return None


# --------------------------------------------------------------------------
# Sampler: runs in the background and records one reading per second
# --------------------------------------------------------------------------

def count_processes_and_threads():
    processes = 0
    threads = 0
    for proc in psutil.process_iter(["num_threads"]):
        processes += 1
        threads += proc.info.get("num_threads") or 0
    return processes, threads


def sampler():
    psutil.cpu_percent(None)
    previous_time = time.time()
    previous_disk = read_disk_counters()
    previous_net = psutil.net_io_counters(pernic=True)
    iface = primary_interface()
    last_iface_check = time.time()
    last_slow_check = 0.0

    while True:
        time.sleep(1)
        try:
            now = time.time()
            elapsed = max(now - previous_time, 0.001)
            previous_time = now

            cpu = psutil.cpu_percent(None)
            memory = psutil.virtual_memory().percent

            speed = None
            try:
                freq = psutil.cpu_freq()
                speed = freq.current if freq else None
            except Exception:
                pass

            disk_active = disk_response = disk_read = disk_write = 0.0
            current_disk = read_disk_counters()
            if current_disk and previous_disk:
                busy_ms = (
                    current_disk["busy_time"] - previous_disk["busy_time"]
                    if current_disk["busy_time"] is not None and previous_disk["busy_time"] is not None
                    else (current_disk["read_time"] - previous_disk["read_time"])
                    + (current_disk["write_time"] - previous_disk["write_time"])
                )
                disk_active = min(100.0, max(0.0, busy_ms / (elapsed * 1000.0) * 100.0))
                operations = (current_disk["read_count"] - previous_disk["read_count"]) + (
                    current_disk["write_count"] - previous_disk["write_count"]
                )
                io_ms = (current_disk["read_time"] - previous_disk["read_time"]) + (
                    current_disk["write_time"] - previous_disk["write_time"]
                )
                disk_response = io_ms / operations if operations > 0 else 0.0
                disk_read = max(0.0, (current_disk["read_bytes"] - previous_disk["read_bytes"]) / elapsed)
                disk_write = max(0.0, (current_disk["write_bytes"] - previous_disk["write_bytes"]) / elapsed)
            previous_disk = current_disk

            if now - last_iface_check > 10:
                iface = primary_interface()
                last_iface_check = now
            current_net = psutil.net_io_counters(pernic=True)
            net_send = net_recv = 0.0
            if iface and iface in current_net and iface in previous_net:
                net_send = max(0.0, (current_net[iface].bytes_sent - previous_net[iface].bytes_sent) / elapsed)
                net_recv = max(0.0, (current_net[iface].bytes_recv - previous_net[iface].bytes_recv) / elapsed)
            previous_net = current_net

            processes = threads = None
            if now - last_slow_check > 5:
                processes, threads = count_processes_and_threads()
                last_slow_check = now

            with lock:
                live.update(
                    cpu=cpu,
                    speed_mhz=speed,
                    disk_active=disk_active,
                    disk_response_ms=disk_response,
                    disk_read=disk_read,
                    disk_write=disk_write,
                    net_iface=iface,
                    net_send=net_send,
                    net_recv=net_recv,
                )
                if processes is not None:
                    live.update(processes=processes, threads=threads)
                history["cpu"].append(round(cpu, 1))
                history["memory"].append(round(memory, 1))
                history["disk_active"].append(round(disk_active, 1))
                history["disk_read"].append(round(disk_read))
                history["disk_write"].append(round(disk_write))
                history["net_send"].append(round(net_send))
                history["net_recv"].append(round(net_recv))
        except Exception:
            continue  # a single bad reading must never stop the sampler


def warm_up():
    """Read slow, rarely changing details in the background at start-up."""
    cpu_name()
    device_info()
    system_disk_info()


@asynccontextmanager
async def lifespan(app):
    threading.Thread(target=sampler, daemon=True).start()
    threading.Thread(target=warm_up, daemon=True).start()
    yield


app = FastAPI(title="PC Assist backend", version=APP_VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*",  # also allow the desktop app window, which loads from a local file
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def snapshot(*names):
    with lock:
        return {name: list(history[name]) for name in names}


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------

@app.get("/api/performance")
def get_performance():
    memory = psutil.virtual_memory()
    disk = system_disk_info()
    with lock:
        current = dict(live)
    series = snapshot("cpu", "memory", "disk_active", "disk_read", "disk_write")
    speed = current["speed_mhz"]
    capacity = disk.get("size") or psutil.disk_usage(SYSTEM_DRIVE).total
    return {
        "cpu": {
            "name": cpu_name(),
            "percent": current["cpu"],
            "speed_ghz": round(speed / 1000, 2) if speed else None,
            "processes": current["processes"],
            "threads": current["threads"],
            "uptime_seconds": int(time.time() - psutil.boot_time()),
            "cores": psutil.cpu_count(logical=False),
            "logical_processors": psutil.cpu_count(logical=True),
            "history": series["cpu"],
        },
        "memory": {
            "total": memory.total,
            "used": memory.total - memory.available,
            "available": memory.available,
            "percent": memory.percent,
            "history": series["memory"],
        },
        "disk": {
            "drive": SYSTEM_DRIVE.rstrip("\\") if IS_WINDOWS else SYSTEM_DRIVE,
            "model": disk.get("model"),
            "type": disk.get("type"),
            "capacity": capacity,
            "active_percent": current["disk_active"],
            "response_ms": current["disk_response_ms"],
            "read_bps": current["disk_read"],
            "write_bps": current["disk_write"],
            "active_history": series["disk_active"],
            "read_history": series["disk_read"],
            "write_history": series["disk_write"],
        },
    }


@app.get("/api/storage")
def get_storage():
    drives = []
    for part in psutil.disk_partitions(all=False):
        if "cdrom" in part.opts or not part.fstype:
            continue
        if part.fstype in ("squashfs", "iso9660") or part.mountpoint.startswith("/snap"):
            continue
        try:
            usage = psutil.disk_usage(part.mountpoint)
        except (PermissionError, OSError):
            continue
        if usage.total == 0:
            continue
        label = volume_label(part.mountpoint)
        letter = part.mountpoint.rstrip("\\")
        if IS_WINDOWS:
            name = f"{label} ({letter})" if label else letter
        else:
            name = part.mountpoint
        free_percent = usage.free / usage.total * 100
        drives.append(
            {
                "id": part.mountpoint,
                "name": name,
                "total": usage.total,
                "used": usage.total - usage.free,
                "free": usage.free,
                "percent_used": round((usage.total - usage.free) / usage.total * 100, 1),
                "is_system": part.mountpoint.upper() == SYSTEM_DRIVE.upper(),
                "status": "low" if free_percent < 10 else "ok",
            }
        )
    drives.sort(key=lambda d: (not d["is_system"], d["name"]))
    return {"drives": drives}


@app.get("/api/network")
def get_network():
    with lock:
        current = dict(live)
    series = snapshot("net_send", "net_recv")
    iface = current["net_iface"]
    result = {
        "connected": iface is not None,
        "badge": None,
        "adapter_name": iface,
        "ssid": None,
        "dns_servers": [],
        "connection_type": None,
        "ipv4": None,
        "ipv6": None,
        "send_bps": current["net_send"],
        "recv_bps": current["net_recv"],
        "send_history": series["net_send"],
        "recv_history": series["net_recv"],
    }
    if not iface:
        return result

    wifi = wifi_details(iface)
    ipv4, ipv6 = interface_addresses(iface)
    stats = psutil.net_if_stats().get(iface)
    result["ipv4"] = ipv4
    result["ipv6"] = ipv6
    result["dns_servers"] = dns_servers(iface)
    if wifi:
        result["ssid"] = wifi["ssid"]
        result["connection_type"] = wifi["radio"]
        result["badge"] = f"Wi-Fi: {wifi['description']}" if wifi["description"] else f"Wi-Fi: {iface}"
    else:
        speed = stats.speed if stats else 0
        result["connection_type"] = f"{speed} Mbps link" if speed else None
        result["badge"] = iface
    return result


@app.get("/api/overview")
def get_overview():
    memory = psutil.virtual_memory()
    with lock:
        current = dict(live)
    try:
        system = psutil.disk_usage(SYSTEM_DRIVE)
        disk = {
            "percent_used": round((system.total - system.free) / system.total * 100, 1),
            "free": system.free,
            "total": system.total,
        }
    except OSError:
        disk = None

    notes = []
    if memory.percent >= 85:
        notes.append(f"Memory use is high at {round(memory.percent)}%.")
    if current["cpu"] >= 85:
        notes.append(f"Processor use is high at {round(current['cpu'])}%.")
    if disk and disk["free"] / disk["total"] < 0.10:
        notes.append("The system drive is almost full.")

    info = device_info()
    return {
        "device_name": socket.gethostname(),
        "model": " ".join(part for part in (info["manufacturer"], info["model"]) if part) or None,
        "cpu_percent": current["cpu"],
        "memory_percent": memory.percent,
        "memory_used": memory.total - memory.available,
        "memory_total": memory.total,
        "disk": disk,
        "net_send_bps": current["net_send"],
        "net_recv_bps": current["net_recv"],
        "notes": notes,
    }


@app.get("/api/about")
def get_about():
    info = device_info()
    return {
        "app_version": APP_VERSION,
        "device_name": socket.gethostname(),
        "manufacturer": info["manufacturer"],
        "model": info["model"],
        "serial_number": info["serial"],
        "os": f"{platform.system()} {platform.release()} (build {platform.version()})",
        "processor": cpu_name(),
        "memory_total": psutil.virtual_memory().total,
    }


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT, log_level="warning")
